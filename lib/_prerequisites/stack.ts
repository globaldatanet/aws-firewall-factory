import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites } from "../types/config";
import { RuntimeProperties } from "../types/runtimeprops";
import {
  aws_s3 as s3,
  aws_kms as kms,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_nodejs as NodejsFunction,
  aws_logs as logs,
  aws_glue as glue,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
  aws_sns as sns,
  aws_fms as fms,
  aws_athena as athena,
  aws_cloudwatch as cloudwatch,
  aws_cloudwatch_actions as cloudwatch_actions,
} from "aws-cdk-lib";
import {
  EventbridgeToStepfunctions,
  EventbridgeToStepfunctionsProps,
} from "@aws-solutions-constructs/aws-eventbridge-stepfunctions";
import * as path from "path";
import { SopsSyncProvider, SopsSecret } from "cdk-sops-secrets";

/** 
 * @packageDocumentation
 * # AWS Firewall Factory Prerequisites Stack
 */

/**
 * @group Interfaces
 * @description
 * Specifies the Prerequisites Stack properties.
 *
 * @param {Prerequisites} prerequisites  Variable for a prerequisites Config.
 * @param {RuntimeProperties} runtimeProperties Variable for Runtime Properties.
 *
 **/

export interface StackProps extends cdk.StackProps {
    /**
   * Class Variable for Prerequisites Properties.
   */
  readonly prerequisites: Prerequisites;
    /**
   * Class Variable for Runtime Properties.
   */
  runtimeProperties: RuntimeProperties;
}

export class PrerequisitesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const accountId = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

    // Create SOPS SecretProvider Construct
    const sopsSyncProvider = new SopsSyncProvider(this, "SopsSyncProvider");

    if (props.prerequisites.Information) {
      console.log(
        "📢  Creating Lambda Function to send AWS managed rule group change status notifications to messengers (Slack/Teams)"
      );

      const InformationSecret = new SopsSecret(this, "InformationSopsSecret", {
        sopsFilePath: props.prerequisites.Information.WebhookSopsFile,
        sopsProvider: sopsSyncProvider,
      });
      const ManagedRuleGroupInfo = new NodejsFunction.NodejsFunction(
        this,
        "AwsFirewallFactoryManagedRuleGroupInfo",
        {
          architecture: lambda.Architecture.ARM_64,
          entry: path.join(
            __dirname,
            "../lib/lambda/ManagedRuleGroupInfo/index.ts"
          ),
          handler: "handler",
          timeout: cdk.Duration.seconds(30),
          environment: {
            WEBHOOK_SECRET: InformationSecret.secretName,
          },
          runtime: lambda.Runtime.NODEJS_20_X,
          memorySize: 128,
          bundling: {
            minify: true,
          },
          description:
            "Lambda Function to send AWS managed rule group change status notifications (like upcoming new versions and urgent security updates) to messengers (Slack/Teams)",
        }
      );
      InformationSecret.grantRead(ManagedRuleGroupInfo);

      new logs.LogGroup(
        this,
        "AWS-Firewall-Factory-ManagedRuleGroupInfo-LogGroup",
        {
          logGroupName: "/aws/lambda/" + ManagedRuleGroupInfo.functionName,
          retention: logs.RetentionDays.ONE_WEEK,
        }
      );

      ManagedRuleGroupInfo.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["wafv2:ListAvailableManagedRuleGroupVersions"],
          resources: ["*"],
        })
      );
      ManagedRuleGroupInfo.addPermission("InvokeByAwsSnsTopic", {
        action: "lambda:InvokeFunction",
        principal: new iam.ServicePrincipal("sns.amazonaws.com"),
        sourceArn:
          "arn:aws:sns:us-east-1:248400274283:aws-managed-waf-rule-notifications",
      });
    }

    if (props.prerequisites.UnutilizedWafs) {
      console.log(
        "📢  Creating StepFunction to send notification about unutilized Firewalls to messengers (Slack/Teams)"
      );

      const UnutilizedWafsSecret = new SopsSecret(
        this,
        "UnutilizedWafsSopsSecret",
        {
          sopsFilePath: props.prerequisites.UnutilizedWafs.WebhookSopsFile,
          sopsProvider: sopsSyncProvider,
        }
      );
      const unutilizedWafsBucket = new s3.Bucket(
        this,
        "AWS-Firewall-Factory-Unused-Resources",
        {
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
          encryption: s3.BucketEncryption.S3_MANAGED,
          enforceSSL: true,
          removalPolicy: cdk.RemovalPolicy.RETAIN,
          bucketName:
            props.prerequisites.General.Prefix.toLocaleLowerCase() +
            "-afwf-unutilized-resources-" +
            accountId +
            "-" +
            region,
        }
      );

      const GetMemberAccountsofFms = new NodejsFunction.NodejsFunction(
        this,
        "GetMemberAccountsofFms",
        {
          architecture: lambda.Architecture.ARM_64,
          entry: path.join(
            __dirname,
            "../lib/lambda/GetMemberAccountsofFms/index.ts"
          ),
          handler: "handler",
          logRetention: logs.RetentionDays.ONE_WEEK,
          timeout: cdk.Duration.seconds(30),
          runtime: lambda.Runtime.NODEJS_20_X,
          memorySize: 128,
          bundling: {
            minify: true,
          },
          description:
            "Lambda Function to get all member accounts of AWS Firewall Manager",
        }
      );

      GetMemberAccountsofFms.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["fms:ListMemberAccounts"],
          resources: ["*"],
        })
      );

      const CheckUnusedWebApplicationFirewalls =
        new NodejsFunction.NodejsFunction(
          this,
          "CheckUnusedWebApplicationFirewalls",
          {
            architecture: lambda.Architecture.ARM_64,
            entry: path.join(
              __dirname,
              "../lib/lambda/CheckUnusedWebApplicationFirewalls/index.ts"
            ),
            handler: "handler",
            timeout: cdk.Duration.seconds(900),
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 128,
            logRetention: logs.RetentionDays.ONE_WEEK,
            bundling: {
              minify: true,
            },
            environment: {
              BUCKET_NAME: unutilizedWafsBucket.bucketName,
              CROSS_ACCOUNT_ROLE_NAME:
                props.prerequisites.UnutilizedWafs.CrossAccountRoleName,
              REGEX_STRING:
                props.prerequisites.UnutilizedWafs.SkipWafRegexString || "",
              AWS_ACCOUNT_ID: cdk.Aws.ACCOUNT_ID,
            },
            description: "Lambda Function to get usage of AWS WAFv2 WebACLs",
          }
        );

      CheckUnusedWebApplicationFirewalls.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["sts:AssumeRole"],
          resources: ["*"],
        })
      );
      unutilizedWafsBucket.grantReadWrite(CheckUnusedWebApplicationFirewalls);

      const SendUnusedResourceNotification = new NodejsFunction.NodejsFunction(
        this,
        "SendUnusedResourceNotification",
        {
          architecture: lambda.Architecture.ARM_64,
          entry: path.join(
            __dirname,
            "../lib/lambda/SendUnusedResourceNotification/index.ts"
          ),
          handler: "handler",
          timeout: cdk.Duration.seconds(30),
          runtime: lambda.Runtime.NODEJS_20_X,
          logRetention: logs.RetentionDays.ONE_WEEK,
          memorySize: 128,
          bundling: {
            minify: true,
          },
          environment: {
            WEBHOOK_SECRET: UnutilizedWafsSecret.secretName,
            BUCKET_NAME: unutilizedWafsBucket.bucketName,
          },
          description:
            "Lambda Function to send notifications about unused AWS WAFv2 WebACLs",
        }
      );
      SendUnusedResourceNotification.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "pricing:Get*",
            "pricing:Describe*",
            "pricing:List*",
            "pricing:Search*",
          ],
          resources: ["*"],
        })
      );
      SendUnusedResourceNotification.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["fms:ListPolicies"],
          resources: ["*"],
        })
      );
      SendUnusedResourceNotification.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["ec2:DescribeRegions"],
          resources: ["*"],
        })
      );
      unutilizedWafsBucket.grantReadWrite(SendUnusedResourceNotification);
      UnutilizedWafsSecret.grantRead(SendUnusedResourceNotification);

      const chain = sfn.Chain.start(
        new tasks.LambdaInvoke(this, "GetMemberAccountsofFmsLambda", {
          lambdaFunction: GetMemberAccountsofFms,
          retryOnServiceExceptions: true,
        })
      )
        .next(
          new sfn.Map(this, "Map", {
            itemsPath: sfn.JsonPath.stringAt("$.Payload"),
            resultPath: sfn.JsonPath.DISCARD,
          }).itemProcessor(
            new tasks.LambdaInvoke(
              this,
              "CheckUnusedWebApplicationFirewallsLambda",
              {
                lambdaFunction: CheckUnusedWebApplicationFirewalls,
                payloadResponseOnly: true,
                retryOnServiceExceptions: true,
              }
            )
          )
        )
        .next(
          new tasks.LambdaInvoke(this, "SendUnsuedResourceNotificationLambda", {
            lambdaFunction: SendUnusedResourceNotification,
            retryOnServiceExceptions: true,
          })
        );

      const constructProps: EventbridgeToStepfunctionsProps = {
        stateMachineProps: {
          stateMachineName:
            "aws-firewall-factory-unutilizedWafs-" + accountId + "-" + region,
          definitionBody: sfn.DefinitionBody.fromChainable(chain),
        },
        eventRuleProps: {
          schedule: props.prerequisites.UnutilizedWafs.ScheduleExpression,
        },
      };
      new EventbridgeToStepfunctions(
        this,
        "eventbridge-stepfunction-invoke",
        constructProps
      );
    }

    if (props.prerequisites.Logging) {
      if (props.prerequisites.Logging.FireHoseKey) {
        console.log("🔑  Creating KMS Key for Kinesis FireHose.");
        const fireHoseKey = new kms.Key(
          this,
          "AWS-Firewall-Factory-FireHoseEncryptionKey",
          {
            enableKeyRotation: true,
            alias:
              props.prerequisites.General.Prefix.toLocaleLowerCase() +
              "-AWS-Firewall-Factory-FireHoseKey",
          }
        );
        if (props.prerequisites.Logging.CrossAccountIdforPermissions) {
          console.log(
            "➕ Adding CrossAccount Permission for KMS Key: " +
              props.prerequisites.General.Prefix.toLocaleLowerCase() +
              "-AWS-Firewall-Factory-FireHoseKey \n\n"
          );
          fireHoseKey.grantEncryptDecrypt(
            new iam.AccountPrincipal(
              props.prerequisites.Logging.CrossAccountIdforPermissions
            )
          );
        }
      }
      if (props.prerequisites.Logging.BucketProperties) {
        console.log(
          "\n🪣  Creating Bucket with Name: AWS-Firewall-Factory-Logging"
        );
        let encryptionKey = undefined;
        if (props.prerequisites.Logging.BucketProperties?.KmsEncryptionKey) {
          console.log(
            "   🔑 Creating KMS Key for: AWS-Firewall-Factory-Logging Bucket."
          );
          encryptionKey = new kms.Key(
            this,
            "AWS-Firewall-Factory-LoggingEncryptionKey",
            {
              enableKeyRotation: true,
              alias:
                props.prerequisites.General.Prefix.toLocaleLowerCase() +
                "-AWS-Firewall-Factory-" +
                "LogsKey",
            }
          );
        }
        /**
         * Move all objects to IA after 90 days
         */
        const lifecycleRule: s3.LifecycleRule = {
          enabled: false,
          id: "objects-after90days-to-ia",
          prefix: "*",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        };

        const accesslogsbucket = new s3.Bucket(
          this,
          "AWS-Firewall-Factory-LoggingBucket-AccessLogs",
          {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            lifecycleRules: [lifecycleRule],
            versioned: true,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            bucketName: props.prerequisites.Logging.BucketProperties?.BucketName
              ? props.prerequisites.General.Prefix.toLocaleLowerCase().toLocaleLowerCase() +
                "-" +
                props.prerequisites.Logging.BucketProperties?.BucketName +
                "-access-logs"
              : props.prerequisites.General.Prefix.toLocaleLowerCase() +
                "-awsfirewallfactory-logging-access-logs" +
                accountId +
                "-" +
                region,
          }
        );

        const bucket = new s3.Bucket(
          this,
          "AWS-Firewall-Factory-LoggingBucket",
          {
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: props.prerequisites.Logging.BucketProperties
              ?.KmsEncryptionKey
              ? s3.BucketEncryption.KMS
              : s3.BucketEncryption.S3_MANAGED,
            encryptionKey,
            enforceSSL: true,
            lifecycleRules: [lifecycleRule],
            serverAccessLogsBucket: accesslogsbucket,
            versioned: props.prerequisites.Logging.BucketProperties?.ObjectLock
              ? true
              : false,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            bucketName: props.prerequisites.Logging.BucketProperties?.BucketName
              ? props.prerequisites.General.Prefix.toLocaleLowerCase() +
                "-" +
                props.prerequisites.Logging.BucketProperties?.BucketName
              : props.prerequisites.General.Prefix.toLocaleLowerCase() +
                "-awsfirewallfactory-logging-" +
                accountId +
                "-" +
                region,
          }
        );

        if (props.prerequisites.Logging.CrossAccountIdforPermissions) {
          console.log(
            "   ➕ Adding CrossAccount Permission for Bucket: AWS-Firewall-Factory-Logging"
          );
          bucket.grantReadWrite(
            new iam.AccountPrincipal(
              props.prerequisites.Logging.CrossAccountIdforPermissions
            )
          );
        }
        if (props.prerequisites.Logging.BucketProperties?.ObjectLock) {
          console.log(
            "   ➕ Adding ObjectLock to Bucket: AWS-Firewall-Factory-Logging \n"
          );
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          console.log(
            "   ⚙️  Settings: \n      🗓️  Retention-Days: " +
              props.prerequisites.Logging.BucketProperties?.ObjectLock?.Days +
              "\n      🛡️  Retention-Mode: " +
              props.prerequisites.Logging.BucketProperties?.ObjectLock?.Mode +
              "\n\n"
          );
          // Get the CloudFormation resource because L2 Construct doenst support this Property
          const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
          // Add the ObjectLockConfiguration prop to the Bucket's CloudFormation output.
          cfnBucket.addPropertyOverride("ObjectLockEnabled", true);
          cfnBucket.addPropertyOverride(
            "ObjectLockConfiguration.ObjectLockEnabled",
            "Enabled"
          );
          cfnBucket.addPropertyOverride(
            "ObjectLockConfiguration.Rule.DefaultRetention.Days",
            props.prerequisites.Logging.BucketProperties?.ObjectLock?.Days
          );
          // Can be `GOVERNANCE` or `COMPLIANCE` - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-s3-bucket-defaultretention.html
          cfnBucket.addPropertyOverride(
            "ObjectLockConfiguration.Rule.DefaultRetention.Mode",
            props.prerequisites.Logging.BucketProperties?.ObjectLock?.Mode
          );
        }
      }
      if (props.prerequisites.Logging.Athena) {
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
            type: "array<struct<conditiontype:string,location:string,matcheddata:array<string>>>",
          },
          httpsourcename: { name: "httpsourcename", type: "string" },
          httpsourceid: { name: "httpsourceid", type: "string" },
          rulegrouplist: {
            name: "rulegrouplist",
            type: "array<struct<rulegroupid:string,terminatingrule:struct<ruleid:string,action:string,rulematchdetails:string>,nonterminatingmatchingrules:array<struct<ruleid:string,action:string,rulematchdetails:array<struct<conditiontype:string,location:string,matcheddata:array<string>>>>>,excludedrules:string>>",
          },
          ratebasedrulelist: {
            name: "ratebasedrulelist",
            type: "array<struct<ratebasedruleid:string,limitkey:string,maxrateallowed:int>>",
          },
          nonterminatingmatchingrules: {
            name: "nonterminatingmatchingrules",
            type: "array<struct<ruleid:string,action:string>>",
          },
          requestheadersinserted: {
            name: "requestheadersinserted",
            type: "string",
          },
          responsecodesent: { name: "responsecodesent", type: "string" },
          httprequest: {
            name: "httprequest",
            type: "struct<clientip:string,country:string,headers:array<struct<name:string,value:string>>,uri:string,args:string,httpversion:string,httpmethod:string,requestid:string>",
          },
          labels: { name: "labels", type: "array<struct<name:string>>" },
          accountidspartition: { name: "accountids", type: "string" },
          regionpartition: { name: "region", type: "string" },
          daypartition: { name: "day", type: "string" },
        };

        // WAF Athena Table
        new glue.CfnTable(this, "FmsLogsAthenaTable", {
          databaseName: props.prerequisites.Logging.Athena.DatabaseName
            ? props.prerequisites.Logging.Athena.DatabaseName
            : "default",
          catalogId: cdk.Aws.ACCOUNT_ID,
          tableInput: {
            description: "description",
            name: props.prerequisites.Logging.Athena.TableName,
            owner: "hadoop",
            parameters: {
              EXTERNAL: "TRUE",
              "projection.accountids.values": props.prerequisites.Logging
                .CrossAccountIdforPermissions
                ? props.prerequisites.Logging.CrossAccountIdforPermissions
                : cdk.Aws.ACCOUNT_ID,
              "projection.accountids.type": "enum",
              "projection.day.format": "yyyy/MM/dd",
              "projection.day.interval": "1",
              "projection.day.interval.unit": "DAYS",
              "projection.day.range": "2021/01/01,NOW",
              "projection.day.type": "date",
              "projection.enabled": "true",
              "projection.region.type": "enum",
              "projection.region.values": props.prerequisites.Logging.Athena
                .Regions
                ? props.prerequisites.Logging.Athena.Regions
                : props.runtimeProperties.AllAwsRegions.toString(),
              "storage.location.template": `s3://${
                props.prerequisites.Logging.BucketProperties?.BucketName
                  ? props.prerequisites.General.Prefix.toLocaleLowerCase() +
                    "-" +
                    props.prerequisites.Logging.BucketProperties?.BucketName
                  : props.prerequisites.General.Prefix.toLocaleLowerCase() +
                    "-awsfirewallfactory-logging-" +
                    accountId +
                    "-" +
                    region
              }/AWSLogs/\${accountids}/FirewallManager/\${region}/\${day}`,
            },
            retention: 0,
            storageDescriptor: {
              columns: Object.values(columnProperties),
              compressed: false,
              inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
              location: `s3://${
                props.prerequisites.Logging.BucketProperties?.BucketName
                  ? props.prerequisites.General.Prefix.toLocaleLowerCase() +
                    "-" +
                    props.prerequisites.Logging.BucketProperties?.BucketName
                  : props.prerequisites.General.Prefix.toLocaleLowerCase() +
                    "-awsfirewallfactory-logging-" +
                    accountId +
                    "-" +
                    region
              }/`,
              numberOfBuckets: -1,
              serdeInfo: {
                serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
                parameters: {
                  "serialization.format": "1",
                },
              },
              outputFormat:
                "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
              storedAsSubDirectories: false,
            },
            partitionKeys: [
              columnProperties.accountidspartition,
              columnProperties.regionpartition,
              columnProperties.daypartition,
            ],
          },
        });
      }
    }

    if (props.prerequisites.DdosNotifications) {
      console.log(
        "📢  Creating Lambda Function that send notifications about potential DDoS activity for protected resources to messengers (Slack/Teams)"
      );

      const DdosFmsNotificationSecret = new SopsSecret(
        this,
        "DdosFmsNotificationSopsSecret",
        {
          sopsFilePath: props.prerequisites.DdosNotifications.WebhookSopsFile,
          sopsProvider: sopsSyncProvider,
        }
      );

      const DdosFmsNotification = new NodejsFunction.NodejsFunction(
        this,
        "AWS-Firewall-Factory-FMS-Notifications",
        {
          architecture: lambda.Architecture.ARM_64,
          entry: path.join(
            __dirname,
            "../lib/lambda/FmsDdosNotification/index.ts"
          ),
          handler: "handler",
          timeout: cdk.Duration.seconds(60),
          runtime: lambda.Runtime.NODEJS_20_X,
          memorySize: 128,
          logRetention: logs.RetentionDays.ONE_WEEK,
          bundling: {
            minify: true,
          },
          environment: {
            WEBHOOK_SECRET: DdosFmsNotificationSecret.secretName,
          },
          description:
            "Lambda Function that send notifications about potential DDoS activity for protected resources to messengers (Slack/Teams)",
        }
      );

      DdosFmsNotificationSecret.grantRead(DdosFmsNotification);

      const snsRole = iam.Role.fromRoleName(
        this,
        "AWSServiceRoleForFMS",
        "aws-service-role/fms.amazonaws.com/AWSServiceRoleForFMS"
      );
      const snsRoleName = snsRole.roleArn;
      const cwService = new iam.ServicePrincipal("cloudwatch.amazonaws.com");
      const FmsTopic = new sns.Topic(this, "FMS-Notifications-Topic");
      FmsTopic.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ["sns:Publish"],
          // Add permission for CloudWatchand FMS to publish to the SNS topic
          principals: [snsRole, cwService],
          resources: [FmsTopic.topicArn],
        })
      );

      DdosFmsNotification.addPermission("InvokeByFmsSnsTopic", {
        action: "lambda:InvokeFunction",
        principal: new iam.ServicePrincipal("sns.amazonaws.com"),
        sourceArn: FmsTopic.topicArn,
      });
      new sns.Subscription(this, "FMSNotificationsTopicSubscription", {
        topic: FmsTopic,
        protocol: sns.SubscriptionProtocol.LAMBDA,
        endpoint: DdosFmsNotification.functionArn,
      });
      new fms.CfnNotificationChannel(
        this,
        "AWS-Firewall-Factory-FMS-NotificationChannel",
        {
          snsRoleName,
          snsTopicArn: FmsTopic.topicArn,
        }
      );
      // Create a CloudWatch Alarm for DDoS attack metrics and add the SNS topic as an action
      const ddosAlarm = new cloudwatch.Alarm(this, "DdosAlarm", {
        metric: new cloudwatch.Metric({
          namespace: "AWS/DDoSProtection",
          metricName: "DDoSDetected",
          statistic: "Sum",
          period: cdk.Duration.minutes(1),
        }),
        threshold: 0,
        evaluationPeriods: 1,
        alarmDescription: "Alarm when a DDoS attack is detected",
        actionsEnabled: true,
      });

      ddosAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(FmsTopic));
    }

    if (props.prerequisites.Grafana) {
      console.log(
        "📢 Amazon Athena table and an Amazon Athena view to build a Managed Grafana dashboard to visualize the events in near real time."
      );

      const FmsDelegatedAdminAccountId = props.prerequisites.Grafana
        .DelegatedAdminAccountId
        ? props.prerequisites.Grafana.DelegatedAdminAccountId
        : cdk.Aws.ACCOUNT_ID;
      const AthenaWorkGroupKey = new kms.Key(
        this,
        "AWS-Firewall-Factory-Grafana-AthenaWorkGroupKey",
        {
          enableKeyRotation: true,
          alias:
            props.prerequisites.General.Prefix.toLocaleLowerCase() +
            "-AWS-Firewall-Factory-Grafana-AthenaWorkGroupKey",
        }
      );

      const GlueCrawlerRole = new iam.Role(
        this,
        "AWS-Firewall-Factory-Grafana-Crawler-Role",
        {
          assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
        }
      );
      GlueCrawlerRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSGlueServiceRole"
        )
      );
      GlueCrawlerRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ["s3:GetObject", "s3:ListBucket"],
          resources: [
            `arn:aws:s3:::${props.prerequisites.Grafana.BucketName}/*`,
          ],
        })
      );

      GlueCrawlerRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ["s3:PutObject", "s3:GetObject"],
          resources: [
            `arn:aws:s3:::${props.prerequisites.Grafana.BucketName}/${FmsDelegatedAdminAccountId}/AwsFirewallFactory/Grafana/*`,
          ],
        })
      );

      if (props.prerequisites.Grafana.BucketKmsKey) {
        GlueCrawlerRole.addToPolicy(
          new iam.PolicyStatement({
            actions: ["kms:Decrypt", "kms:Encrypt"],
            resources: [
              props.prerequisites.Grafana.BucketKmsKey,
              AthenaWorkGroupKey.keyArn,
            ],
          })
        );
      }
      const GlueDatabase = new glue.CfnDatabase(
        this,
        "AWS-Firewall-Factory-Grafana-Database",
        {
          catalogId: cdk.Aws.ACCOUNT_ID,
          databaseInput: {
            name: "aws_firewall_factory_grafana",
            description: "Database for AWS Firewall Factory Grafana Dashboards",
          },
        }
      );
      new glue.CfnCrawler(this, "AWS-Firewall-Factory-Grafana-Crawler", {
        name: "aws-firewall-factory-grafana-crawler",
        role: GlueCrawlerRole.roleArn,
        databaseName: GlueDatabase.ref,
        targets: {
          s3Targets: [
            {
              path: `s3://${props.prerequisites.Grafana.BucketName}/${FmsDelegatedAdminAccountId}/FirewallManager/`,
            },
          ],
        },
        schedule: {
          scheduleExpression: "cron(0 */1 * * ? *)",
        },
      });

      const AthenaWorkgroup = new athena.CfnWorkGroup(
        this,
        "AWS-Firewall-Factory-Grafana-WorkGroup",
        {
          name: "aws_firewall_factory_db",
          state: "ENABLED",
          workGroupConfiguration: {
            enforceWorkGroupConfiguration: true,
            publishCloudWatchMetricsEnabled: true,
            resultConfiguration: {
              outputLocation: `s3://${props.prerequisites.Grafana.BucketName}/${FmsDelegatedAdminAccountId}/AwsFirewallFactory/Grafana/`,
            },
            customerContentEncryptionConfiguration: {
              kmsKey: AthenaWorkGroupKey.keyArn,
            },
          },
          tags: [{ key: "GrafanaDataSource", value: "true" }],
        }
      );

      new athena.CfnNamedQuery(
        this,
        "AWS-Firewall-Factory-Grafana-NamedQuery",
        {
          database: GlueDatabase.ref,
          queryString: `CREATE OR REPLACE VIEW "waflogs" AS
        SELECT DISTINCT *
        FROM
        "AwsDataCatalog".${props.prerequisites.Grafana.FmsLogAthenaDatabase}.${props.prerequisites.Grafana.FmsLogsAthenaTable}
        WHERE cast(date_parse(day, '%Y/%m/%d') as date) > current_date - interval '${props.prerequisites.Grafana.TimeWindow}' day`,
          name: "aws_firewall_factory_waf_centralized_logging",
          description: "AWS WAF Logging dashboard summary view",
          workGroup: AthenaWorkgroup.ref,
        }
      );
    }
  }
}
