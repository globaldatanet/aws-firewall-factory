import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites } from "./types/config";
import { aws_s3 as s3, aws_kms as kms, aws_iam as iam, aws_lambda as lambda, aws_lambda_nodejs as NodejsFunction, aws_logs as logs, aws_glue as glue, aws_ssm as ssm  } from "aws-cdk-lib";
import * as path from "path";

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
      const ManagedRuleGroupInfo = new NodejsFunction.NodejsFunction(this, "AwsFirewallFactoryManagedRuleGroupInfo", {
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(__dirname, "../lib/lambda/ManagedRuleGroupInfo/index.ts"),
        handler: "handler",
        timeout: cdk.Duration.seconds(30),
        environment: {
          "MESSENGER": Messenger,
          "WEBHOOK_URL": WebhookUrl,
        },
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        bundling: {
          minify: true,
        },
        description: "Lambda Function to send AWS managed rule group change status notifications (like upcoming new versions and urgent security updates) to messengers (Slack/Teams)",
      });

      new logs.LogGroup(this, "AWS-Firewall-Factory-ManagedRuleGroupInfo-LogGroup",{
        logGroupName: "/aws/lambda/"+ManagedRuleGroupInfo.functionName,
        retention: logs.RetentionDays.ONE_WEEK,
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
      if(props.prerequisites.Logging.Athena){
        // WAF Athena Log comlumn Properties
        const columnProperties = {
          timestamp: { name: "timestamp", type: "bigint" },
          formatversion: { name: "formatversion", type: "int" },
          webaclid: { name: "webaclid", type: "string" },
          terminatingruleid: { name: "terminatingruleid", type: "string" },
          terminatingruletype: { name: "terminatingruletype", type: "string" },
          action: { name: "action", type: "string" },
          terminatingrulematchdetails: {
            name: "terminatingrulematchdetails",
            type: "array<struct<conditiontype:string,location:string,matcheddata:array<string>>>"
          },
          httpsourcename: { name: "httpsourcename", type: "string" },
          httpsourceid: { name: "httpsourceid", type: "string" },
          rulegrouplist: {
            name: "rulegrouplist",
            type: "array<struct<rulegroupid:string,terminatingrule:struct<ruleid:string,action:string,rulematchdetails:string>,nonterminatingmatchingrules:array<struct<ruleid:string,action:string,rulematchdetails:array<struct<conditiontype:string,location:string,matcheddata:array<string>>>>>,excludedrules:string>>"
          },
          ratebasedrulelist: {
            name: "ratebasedrulelist",
            type: "array<struct<ratebasedruleid:string,limitkey:string,maxrateallowed:int>>"
          },
          nonterminatingmatchingrules: {
            name: "nonterminatingmatchingrules",
            type: "array<struct<ruleid:string,action:string>>"
          },
          requestheadersinserted: { name: "requestheadersinserted", type: "string" },
          responsecodesent: { name: "responsecodesent", type: "string" },
          httprequest: {
            name: "httprequest",
            type: "struct<clientip:string,country:string,headers:array<struct<name:string,value:string>>,uri:string,args:string,httpversion:string,httpmethod:string,requestid:string>"
          },
          labels: { name: "labels", type: "array<struct<name:string>>" },
          accountidspartition: { name: "accountids", type: "string" },
          regionpartition: { name: "region", type: "string" },
          daypartition: { name: "day", type: "string" }
        };
        
        const aws_regions = ssm.StringParameter.valueForStringParameter(this, "/aws/service/global-infrastructure/services/ssm/regions");
        // WAF Athena Table
        new glue.CfnTable(this, "FmsLogsAthenaTable", {
          databaseName: props.prerequisites.Logging.Athena.DatabaseName,
          catalogId: cdk.Aws.ACCOUNT_ID,
          tableInput: {
            description: "description",
            name: props.prerequisites.Logging.Athena.TableName,
            owner: "hadoop",
            parameters: {
              "EXTERNAL": "TRUE",
              "projection.accountids.values":  props.prerequisites.Logging.CrossAccountIdforPermissions ? props.prerequisites.Logging.CrossAccountIdforPermissions : cdk.Aws.ACCOUNT_ID,
              "projection.accountids.type": "enum",
              "projection.day.format": "yyyy/MM/dd",
              "projection.day.interval": "1",
              "projection.day.interval.unit": "DAYS",
              "projection.day.range": "2021/01/01,NOW",
              "projection.day.type": "date",
              "projection.enabled": "true",
              "projection.region.type": "enum",
              "projection.region.values":  props.prerequisites.Logging.Athena.Regions ? props.prerequisites.Logging.Athena.Regions : aws_regions.toString(),
              "storage.location.template": `s3://${props.prerequisites.Logging.BucketProperties?.BucketName ? props.prerequisites.General.Prefix.toLocaleLowerCase() + "-" + props.prerequisites.Logging.BucketProperties?.BucketName : props.prerequisites.General.Prefix.toLocaleLowerCase() + "-awsfirewallfactory-logging-" + accountId + "-" + region}/AWSLogs/\${accountids}/FirewallManager/\${region}/\${day}`,
            },
            retention: 0,
            storageDescriptor: {
              columns: Object.values(columnProperties),
              compressed: false,
              inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
              location: `s3://${props.prerequisites.Logging.BucketProperties?.BucketName ? props.prerequisites.General.Prefix.toLocaleLowerCase() + "-" + props.prerequisites.Logging.BucketProperties?.BucketName : props.prerequisites.General.Prefix.toLocaleLowerCase() + "-awsfirewallfactory-logging-" + accountId + "-" + region}/`,
              numberOfBuckets: -1,
              serdeInfo: {
                serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
                parameters: {
                  "serialization.format": "1"
                }
              },
              outputFormat: "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
              storedAsSubDirectories: false,
            },
            partitionKeys: [
              columnProperties.accountidspartition,
              columnProperties.regionpartition,
              columnProperties.daypartition
            ]
          },
        });
      }
    }

  }
}