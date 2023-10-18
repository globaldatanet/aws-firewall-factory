import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites } from "./types/config";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_kms as kms } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import { aws_logs as logs } from "aws-cdk-lib";
import { aws_fms as fms } from "aws-cdk-lib";
import { aws_sns as sns } from "aws-cdk-lib";
export interface StackProps extends cdk.StackProps {
    readonly prerequisites: Prerequisites;
  }


export class PrerequisitesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const accountId = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    if(props.prerequisites.Information){
      console.log("📢  Creating Lambda Function to send AWS managed rule group change status notifications to messengers (Slack/Teams)");
      let Messenger:string = "";
      let WebhookUrl:string = "";
      if(props.prerequisites.Information.SlackWebhook) {
        Messenger="Slack";
        WebhookUrl=props.prerequisites.Information.SlackWebhook;
      }
      if(props.prerequisites.Information.TeamsWebhook) {
        Messenger="Teams";
        WebhookUrl=props.prerequisites.Information.TeamsWebhook;
      }
      const ManagedRuleGroupInfo = new lambda.Function(this, "AWS-Firewall-Factory-ManagedRuleGroupInfo", {
        runtime: lambda.Runtime.PYTHON_3_11,
        code: lambda.Code.fromAsset("./lib/lambda/ManagedRuleGroupInfo"),
        handler: "index.lambda_handler",
        timeout: cdk.Duration.seconds(30),
        environment: {
          "Messenger": Messenger,
          "WebhookUrl": WebhookUrl,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        description: "Lambda Function to send AWS managed rule group change status notifications (like upcoming new versions and urgent security updates) to messengers (Slack/Teams)",
      });
      ManagedRuleGroupInfo.addToRolePolicy(new iam.PolicyStatement({
        actions: ["wafv2:ListAvailableManagedRuleGroupVersions"],
        resources: ["*"],
      }));
      ManagedRuleGroupInfo.addPermission("InvokeByAwsSnsTopic", {
        action: "lambda:InvokeFunction",
        principal: new iam.ServicePrincipal("sns.amazonaws.com"),
        sourceArn: "arn:aws:sns:us-east-1:248400274283:aws-managed-waf-rule-notifications",
      });

      if(props.prerequisites.Information.Ddos) {
        const FmsNotification = new lambda.Function(this, "AWS-Firewall-Factory-FMS-Notifications", {
          runtime: lambda.Runtime.PYTHON_3_11,
          code: lambda.Code.fromAsset("./lib/lambda/FmsNotification"),
          handler: "index.lambda_handler",
          timeout: cdk.Duration.seconds(30),
          environment: {
            "Messenger": Messenger,
            "WebhookUrl": WebhookUrl,
          },
          logRetention: logs.RetentionDays.ONE_WEEK,
          description: "Lambda Function to send that notifications about potential DDoS activity for protected resources to messengers (Slack/Teams)",
        });
        const snsRoleName = `arn:aws:iam::${props.env?.account}:role/aws-service-role/fms.amazonaws.com/AWSServiceRoleForFMS`;
        const FmsTopic = new sns.Topic(this, "FMS-Notifications-Topic");
        FmsTopic.addToResourcePolicy(new iam.PolicyStatement({
          actions: ["sns:Publish"],
          principals: [iam.Role.fromRoleArn(this, "AWSServiceRoleForFMS",snsRoleName)],
        }));
        FmsNotification.addPermission("InvokeByFmsSnsTopic", {
          action: "lambda:InvokeFunction",
          principal: new iam.ServicePrincipal("sns.amazonaws.com"),
          sourceArn: FmsTopic.topicArn,
        });
        new fms.CfnNotificationChannel(this, "AWS-Firewall-Factory-FMS-NotificationChannel", {
          snsRoleName,
          snsTopicArn: FmsTopic.topicArn,
        });
      }
    }

    if(props.prerequisites.Logging) {
      if(props.prerequisites.Logging.FireHoseKey) {
        console.log("🔑  Creating KMS Key for Kinesis FireHose.");
        const fireHoseKey = new kms.Key(this, "AWS-Firewall-Factory-FireHoseEncryptionKey", {
          enableKeyRotation: true,
          alias: props.prerequisites.General.Prefix.toLocaleLowerCase() + "-AWS-Firewall-Factory-FireHoseKey"
        });
        if(props.prerequisites.Logging.CrossAccountIdforPermissions) {
          console.log("➕ Adding CrossAccount Permission for KMS Key: " + props.prerequisites.General.Prefix.toLocaleLowerCase() + "-AWS-Firewall-Factory-FireHoseKey \n\n");
          fireHoseKey.grantEncryptDecrypt(new iam.AccountPrincipal(props.prerequisites.Logging.CrossAccountIdforPermissions));
        }
      }
      if(props.prerequisites.Logging.BucketProperties){
        console.log("\n🪣  Creating Bucket with Name: AWS-Firewall-Factory-Logging");
        let encryptionKey = undefined;
        if(props.prerequisites.Logging.BucketProperties?.KmsEncryptionKey){
          console.log("   🔑 Creating KMS Key for: AWS-Firewall-Factory-Logging Bucket.");
          encryptionKey = new kms.Key(this, "AWS-Firewall-Factory-LoggingEncryptionKey", {
            enableKeyRotation: true,
            alias: props.prerequisites.General.Prefix.toLocaleLowerCase() + "-AWS-Firewall-Factory-" + "LogsKey"
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


        const accesslogsbucket = new s3.Bucket(this, "AWS-Firewall-Factory-LoggingBucket-AccessLogs", {
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          encryption: s3.BucketEncryption.S3_MANAGED,
          enforceSSL: true,
          lifecycleRules: [lifecycleRule],
          versioned: true,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
          removalPolicy: cdk.RemovalPolicy.RETAIN,
          bucketName: props.prerequisites.Logging.BucketProperties?.BucketName ? props.prerequisites.General.Prefix.toLocaleLowerCase().toLocaleLowerCase() + "-" + props.prerequisites.Logging.BucketProperties?.BucketName + "-access-logs" : props.prerequisites.General.Prefix.toLocaleLowerCase() + "-awsfirewallfactory-logging-access-logs" + accountId + "-" + region
        });

        const bucket = new s3.Bucket(this, "AWS-Firewall-Factory-LoggingBucket", {
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          encryption: props.prerequisites.Logging.BucketProperties?.KmsEncryptionKey ? s3.BucketEncryption.KMS : s3.BucketEncryption.S3_MANAGED,
          encryptionKey,
          enforceSSL: true,
          lifecycleRules: [lifecycleRule],
          serverAccessLogsBucket: accesslogsbucket,
          versioned: props.prerequisites.Logging.BucketProperties?.ObjectLock ? true : false,
          objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
          removalPolicy: cdk.RemovalPolicy.RETAIN,
          bucketName: props.prerequisites.Logging.BucketProperties?.BucketName ? props.prerequisites.General.Prefix.toLocaleLowerCase() + "-" + props.prerequisites.Logging.BucketProperties?.BucketName : props.prerequisites.General.Prefix.toLocaleLowerCase() + "-awsfirewallfactory-logging-" + accountId + "-" + region
        });

        if(props.prerequisites.Logging.CrossAccountIdforPermissions) {
          console.log("   ➕ Adding CrossAccount Permission for Bucket: AWS-Firewall-Factory-Logging");
          bucket.grantReadWrite(new iam.AccountPrincipal(props.prerequisites.Logging.CrossAccountIdforPermissions));
        }
        if(props.prerequisites.Logging.BucketProperties?.ObjectLock) {
          console.log("   ➕ Adding ObjectLock to Bucket: AWS-Firewall-Factory-Logging \n");
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          console.log("   ⚙️  Settings: \n      🗓️  Retention-Days: " + props.prerequisites.Logging.BucketProperties?.ObjectLock?.Days + "\n      🛡️  Retention-Mode: " + props.prerequisites.Logging.BucketProperties?.ObjectLock?.Mode + "\n\n");
          // Get the CloudFormation resource because L2 Construct doenst support this Property
          const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
          // Add the ObjectLockConfiguration prop to the Bucket's CloudFormation output.
          cfnBucket.addPropertyOverride("ObjectLockEnabled", true);
          cfnBucket.addPropertyOverride("ObjectLockConfiguration.ObjectLockEnabled", "Enabled");
          cfnBucket.addPropertyOverride("ObjectLockConfiguration.Rule.DefaultRetention.Days", props.prerequisites.Logging.BucketProperties?.ObjectLock?.Days);
          // Can be `GOVERNANCE` or `COMPLIANCE` - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-defaultretention.html
          cfnBucket.addPropertyOverride("ObjectLockConfiguration.Rule.DefaultRetention.Mode", props.prerequisites.Logging.BucketProperties?.ObjectLock?.Mode);
        }

      }
    }

  }
}