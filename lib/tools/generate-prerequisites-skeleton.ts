import { Prerequisites } from "../types/config";

const prerequisitesConfig : Prerequisites = {
  General: {
    Prefix: "myPrefix",
  },
  "Logging": {
    "BucketProperties": {
      "BucketName": "aws-firewall-factory-logs",
      "KmsEncryptionKey": true,
      "ObjectLock": {
        "Days": 5,
        "Mode": "GOVERNANCE"
      }
    },
    "FireHoseKey": {
      "KeyAlias": "aws-firewall-factory-firehosekey"
    },
    "CrossAccountIdforPermissions": "123456789012",
}
};

console.log(JSON.stringify(prerequisitesConfig, null, 2));