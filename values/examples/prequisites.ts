import { Prerequisites } from "../../lib/types/config";
export const prequisites: Prerequisites = {
  General: {
    Prefix: "aws-firewall-factory",
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
  }
};