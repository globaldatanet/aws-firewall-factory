import { Prerequisites } from "../../lib/types/config";
export const prequisites: Prerequisites = {
  General: {
    Prefix: "aws-firewall-factory-ddos",
  },
  Logging: {
    BucketProperties: {
      BucketName: "aff-logs-ddos",
      KmsEncryptionKey: true,
      ObjectLock: {
        Days: 5,
        Mode: "GOVERNANCE"
      }
    },
    FireHoseKey: {
      KeyAlias: "aws-firewall-factory-firehosekey-ddos"
    },
    CrossAccountIdforPermissions: "534441076043",
  },
  DdosNotifications:{WebhookSopsFile: "./values/examples/webhooks/slack.json"}
};