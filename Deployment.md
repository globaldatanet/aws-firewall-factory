## 🛡️ Deployment

### ⚙️ Prerequisites
1. [Organizations trusted access with Firewall Manager](https://docs.aws.amazon.com/organizations/latest/userguide/services-that-can-integrate-fms.html)
2. [Taskfile](https://taskfile.dev/)
3. [AWS CDK](https://aws.amazon.com/cdk/)
4. [cfn-dia](https://www.npmjs.com/package/@mhlabs/cfn-diagram?s=03)
5. Invoke `npm i` to install dependencies
6. ⚠️ Before installing a stack to your aws account using aws cdk you need to prepare the account using a [cdk bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

7. (Optional) If you want to use CloudWatch Dashboards - You need to enable your target accounts to share CloudWatch data with the central security account follow [this](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Cross-Account-Cross-Region.html#enable-cross-account-cross-Region) to see how to do it.
8. Assume AWS Profile `awsume PROFILENAME`
9. (Optional) Enter `task generateprerequisitesconfig`

  | Parameter  | Value |
  | ------------- | ------------- |
  | Prefix  | Prefix for all Resources  |
  | BucketName [^1] | Name of the S3 Bucket |
  | KmsEncryptionKey | true or false  |
  | ObjectLock - Days [^1]| A period of Days for ObjectLock |
  | ObjectLock - Mode [^1]| COMPLIANCE or GOVERNANCE |
  | FireHoseKey - KeyAlias [^1] | Alias for Key |
  | CrossAccountIdforPermissions [^1] | Id of AWS Account for CrossAccount Permission for Bucket and KMS Key(s)|

10. Enter `task deploy config=NAMEOFYOURCONFIGFILE prerequisite=true`


### 🏁 Deployment via Taskfile

1. Create new ts file for you WAF and configure Rules in the Configuration (see [owasptopten.ts](values/examples/owasptop10.ts) to see structure) or use enter `task generate-waf-skeleton`

2. Assume AWS Profile `awsume / assume PROFILENAME`
3. (Optional) Enter `task generate-waf-skeleton`
4. Enter `task deploy config=NAMEOFYOURCONFIGFILE`