import { prerequisites } from "../../lib/types/config";
export const prequisites: prerequisites.PrerequisitesConfig = {
  General: {
    Prefix: "aws-firewall-factory1",
  },
  Logging: {
    BucketProperties: {
      BucketName: "aws-firewall-factory-logs",
      KmsEncryptionKey: true,
      ObjectLock: {
        Days: 5,
        Mode: "GOVERNANCE"
      }
    },
    FireHoseKey: {
      KeyAlias: "aws-firewall-factory-firehosekey"
    },
    CrossAccountIdforPermissions: "123456789012",
  },
  DdosNotifications:{WebhookSopsFile: "./values/examples/webhooks/slack.json"}
};