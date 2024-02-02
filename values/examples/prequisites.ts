import { Prerequisites } from "../../lib/types/config";
export const prequisites: Prerequisites = {
  General: {
    Prefix: "aws-firewall-factory1",
  },
  Information: {
    SlackWebhook: "https://hooks.slack.com/services/XXXXXXXXX/XXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX",
  },
  Logging: {
    BucketProperties: {
      BucketName: "aws-firewall-factory-logs12",
      KmsEncryptionKey: true,
      ObjectLock: {
        Days: 5,
        Mode: "GOVERNANCE"
      }
    },
    FireHoseKey: {
      KeyAlias: "aws-firewall-factory-firehosekey12"
    },
    CrossAccountIdforPermissions: "859220371210",
  }
};