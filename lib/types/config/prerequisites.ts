import { aws_events as events} from "aws-cdk-lib";
/**
 * Interface for Prerequisites Stacks in the Firewall Factory
 */
export interface PrerequisitesConfig {
    readonly General: {
      /**
       * Defines a Prefix which will be added to all resources.
       */
      readonly Prefix: string;
    };
    /**
     * Will add a Lambda function to the prerequisite stack that sends notifications when new versions and updates to a AWS ManagedRuleGroup appear in messengers (Slack/Teams).
     */
    readonly Information?: {
      WebhookSopsFile: string;
    };
  
    /**
     * Will add a StepFunction which is indentifying and sending information about unutilized WAFs to messengers (Slack/Teams).
     */
    readonly UnutilizedWafs?: {
      /**
       * Define a Schedule for the StepFunction. The ScheduleExpression is a cron expression that specifies when the rule is triggered.
       */
      ScheduleExpression: events.Schedule;
      /**
       * Define a Sops File for the Webhook URL with the Slack or Teams Webhook URL.
       * https://github.com/dbsystel/cdk-sops-secrets
       */
      WebhookSopsFile: string;
      /**
       * Define a Regex to skip WAFs with specific names
       */
      SkipWafRegexString?: string;
      /**
       * Define a Cross Account Role Name for the Lambda which is identifying unutilized WAFs in the managed accounts.
       */
      CrossAccountRoleName: string;
    };
    /**
     * Will add a Lambda function to prerequisite Stack that send notifications about potential DDoS activity for protected resources to messengers (Slack/Teams)
     * This feature, coupled with [AWS Shield Advanced](https://aws.amazon.com/shield/).
     */
    readonly DdosNotifications?: {
      /**
       * Define a Sops File for the Webhook URL with the Slack or Teams Webhook URL.
       * https://github.com/dbsystel/cdk-sops-secrets
       */
      WebhookSopsFile: string;
    };
    readonly Logging?: {
      readonly BucketProperties?: {
        /**
         * A name for the bucket. Allowed Pattern: ^[a-z0-9][a-z0-9//.//-]*[a-z0-9]$
         */
        readonly BucketName?: string;
        /**
         * Define if a KMS Key for the bucket will be created.
         */
        readonly KmsEncryptionKey: boolean;
        /**
         * Will add Object Lock (write-once-read-many (WORM)) to the S3 Bucket (Object Lock can help prevent objects from being deleted or overwritten for a fixed amount of time or indefinitely.)
         */
        readonly ObjectLock?: {
          readonly Days: number;
          readonly Mode: "GOVERNANCE" | "COMPLIANCE";
        };
      };
      /**
       * Define if a KMS Key for Kinesis FireHose will be created.
       */
      readonly FireHoseKey?: {
        /**
         * Define if a Alias for the KMS Key
         */
        readonly KeyAlias: string;
      };
      /**
       * Defines access to a central security account. Please specify a account ID such as 123456789012.This is necessary if you want to use a different account for all your firewalls.
       */
      readonly CrossAccountIdforPermissions?: string;
      readonly Athena?: {
        /**
         * Define a Athena Table for the Firewall Logs will be created.
         */
        readonly TableName: string;
        /**
         * Define a Athena DatabaseName where the Table will be created.
         */
        readonly DatabaseName?: string;
        /**
         * Define a AWS Regions where FMS WAFs will be created. This value is used to create Index for regions on Athena Table.
         * If this value is not set, the Index will be created for all AWS Regions using [public region parameter](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-public-parameters-global-infrastructure.html).
         */
        readonly Regions?: string;
      };
    };
  
    readonly Grafana?: {
      /**
       * S3 Bucket where the FMS Logs are beeing stored. Allowed Pattern: ^[a-z0-9][a-z0-9//.//-]*[a-z0-9]$
       */
      readonly BucketName?: string;
      /*
       * Specify the KMS Key for the S3 Bucket - if its KMS Encrypted
       */
      readonly BucketKmsKey?: string;
      /**
       * Firewall Manager Delegated Admin Account Id
       * @TJS-pattern "^[0-9]{12}$"
       */
      readonly DelegatedAdminAccountId?: string;
      /*
       * Specify the Athena Table Name for the FMS Logs
       */
      readonly FmsLogsAthenaTable: string;
      /*
       * Specify the Athena Database Name for the FMS Logs
       */
      readonly FmsLogAthenaDatabase: string;
      /*
       * Specify the Time Window in Days for the FMS Logs to be Queried - This will be used to create the Athena View for Grafana
       */
      readonly TimeWindow: number;
    };
  }