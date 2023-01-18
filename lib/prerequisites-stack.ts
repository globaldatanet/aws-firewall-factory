import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites, ObjectLockMode } from "./types/config";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_kms as kms } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
export interface StackProps extends cdk.StackProps {
    readonly prerequisites: Prerequisites;
  }


export class PrerequisitesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const account_id = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;


    if(props.prerequisites.Logging.FireHoseKey) {
      const fireHoseKey = new kms.Key(this, "AWS-Firewall-Factory-FireHoseEncryptionKey", {
        enableKeyRotation: true,
        alias: props.prerequisites.General.Prefix + "-AWS-Firewall-Factory-FireHoseKey"
      });
      if(props.prerequisites.Logging.CrossAccountIdforPermissions) {
        fireHoseKey.grantEncryptDecrypt(new iam.AccountPrincipal(props.prerequisites.Logging.CrossAccountIdforPermissions));
      }
    }
    if(props.prerequisites.Logging.BucketProperties){
      let encryptionKey = undefined;
      if(props.prerequisites.Logging.BucketProperties?.KmsEncryptionKey){
        encryptionKey = new kms.Key(this, "AWS-Firewall-Factory-LoggingEncryptionKey", {
          enableKeyRotation: true,
          alias: props.prerequisites.General.Prefix + "-AWS-Firewall-Factory-" + "LogsKey"
        });
      }
      /**
         * Move all objects to IA after 90 days
        */
      const lifecycleRule: s3.LifecycleRule = {
        enabled: false,
        id: "objects-after90days-to-ia",
        prefix: "*",
        transitions: [{
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(90)
        }],
      };


      const accesslogsbucket = new s3.Bucket(scope, "AWS-Firewall-Factory-LoggingBucket-AccessLogs", {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: props.prerequisites.Logging.BucketProperties?.KmsEncryptionKey ? s3.BucketEncryption.KMS_MANAGED : s3.BucketEncryption.S3_MANAGED,
        encryptionKey,
        enforceSSL: true,
        lifecycleRules: [lifecycleRule],
        versioned: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        bucketName: props.prerequisites.Logging.BucketProperties?.BucketName ? props.prerequisites.General.Prefix + "-" + props.prerequisites.Logging.BucketProperties?.BucketName + "-access-logs" : props.prerequisites.General.Prefix + "-awsfirewallfactory-logging-access-logs" + account_id + "-" + region
      });

      const bucket = new s3.Bucket(scope, "AWS-Firewall-Factory-LoggingBucket", {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: props.prerequisites.Logging.BucketProperties?.KmsEncryptionKey ? s3.BucketEncryption.KMS_MANAGED : s3.BucketEncryption.S3_MANAGED,
        encryptionKey,
        enforceSSL: true,
        lifecycleRules: [lifecycleRule],
        serverAccessLogsBucket: accesslogsbucket,
        versioned: props.prerequisites.Logging.BucketProperties?.ObjectLock ? true : false,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        bucketName: props.prerequisites.Logging.BucketProperties?.BucketName ? props.prerequisites.General.Prefix + "-" + props.prerequisites.Logging.BucketProperties?.BucketName : props.prerequisites.General.Prefix + "-awsfirewallfactory-logging-" + account_id + "-" + region
      });

      if(props.prerequisites.Logging.CrossAccountIdforPermissions) {
        bucket.grantReadWrite(new iam.AccountPrincipal(props.prerequisites.Logging.CrossAccountIdforPermissions));
      }
      if(props.prerequisites.Logging.BucketProperties?.ObjectLock) {
        // Get the CloudFormation resource because L2 Construct doenst support this Property
        const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
        // Add the ObjectLockConfiguration prop to the Bucket's CloudFormation output.
        cfnBucket.addPropertyOverride("ObjectLockConfiguration.ObjectLockEnabled", "Enabled");
        cfnBucket.addPropertyOverride("ObjectLockConfiguration.Rule.DefaultRetention.Days", props.prerequisites.Logging.BucketProperties?.ObjectLock?.Days);
        // Can be `GOVERNANCE` or `COMPLIANCE` - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-defaultretention.html
        cfnBucket.addPropertyOverride("ObjectLockConfiguration.Rule.DefaultRetention.Mode", props.prerequisites.Logging.BucketProperties?.ObjectLock?.Mode);
      }

    }
  }
}