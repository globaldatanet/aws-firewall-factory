import { Config } from "../types/config";

const owasptop10Config : Config = {
  General: {
    DeployHash: "",
    FireHoseKeyArn: "",
    Prefix: "myPrefix",
    Stage: "dev|int|clone|live",
    S3LoggingBucketName: "myBucketName",
    SecuredDomain: ["yourapp.<stage>.<domain>"],
    CreateDashboard: true,
    LoggingConfiguration: "Firehose",
  },
  WebAcl: {
    IncludeMap: {
      account: ["123456789123"]
    },
    Name: "myWAF-Name",
    PreProcess: {
      ManagedRuleGroups: [
        {
          "Vendor": "AWS",
          "Name": "AWSManagedRulesAmazonIpReputationList",
          "Version": "",
          "Capacity": 25
        },
        {
          "Vendor": "AWS",
          "Name": "AWSManagedRulesAnonymousIpList",
          "Version": "",
          "Capacity": 50
        },
        {
          "Vendor": "AWS",
          "Name": "AWSManagedRulesBotControlRuleSet",
          "Version": "",
          "Capacity": 50
        },
        {
          "Vendor": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet",
          "Version": "",
          "Capacity": 700
        },
        {
          "Vendor": "AWS",
          "Name": "AWSManagedRulesKnownBadInputsRuleSet",
          "Version": "",
          "Capacity": 200
        },
        {
          "Vendor": "AWS",
          "Name": "AWSManagedRulesSQLiRuleSet",
          "Version": "",
          "Capacity": 200
        }
      ]
    },
    PostProcess: {

    },
    Scope: "REGIONAL",
    Type: "AWS::ElasticLoadBalancingV2::LoadBalancer"
  }
};

console.log(JSON.stringify(owasptop10Config, null, 2));