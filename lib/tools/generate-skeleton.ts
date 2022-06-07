import { Config } from "../types/config";

const skeletonConfig : Config = {
  General: {
    DeployHash: "",
    FireHoseKeyArn: "",
    Prefix: "myPrefix",
    Stage: "dev|int|clone|live",
    S3LoggingBucketName: "myBucketName",
    SecuredDomain: "yourapp.<stage>.<domain>"
  },
  WebAcl: {
    IncludeMap: {
      account: ["123456789123"]
    },
    Name: "myWAF-Name",
    PreProcess: {
      ManagedRuleGroups: [
        {
          Vendor: "AWS",
          Name: "AWSManagedRulesAmazonIpReputationList",
          Capacity: 25,
          Version: ""
        },
        {
          Vendor: "AWS",
          Name: "AWSManagedRulesCommonRuleSet",
          Capacity: 700,
          Version: "",
        }
      ]
    },
    PostProcess: {

    },
    Scope: "REGIONAL",
    Type: "AWS::ElasticLoadBalancingV2::LoadBalancer"
  }
};

console.log(JSON.stringify(skeletonConfig, null, 2));