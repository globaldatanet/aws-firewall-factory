import { Config } from "../../lib/types/config";
export const config: Config = {
  General: {
    DeployHash: "",
    FireHoseKeyArn: "",
    Prefix: "aws-firewall-factory",
    Stage: "dev",
    S3LoggingBucketName: "myBucketName",
    SecuredDomain: ["yourapp.<stage>.<domain>"],
    CreateDashboard: true,
    LoggingConfiguration: "Firehose",
  },
  WebAcl: {
    IncludeMap: {
      account: ["123456789123"]
    },
    Name: "owasptopTen",
    PreProcess: {
      ManagedRuleGroups: [
        {
          vendor: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
          version: "",
          capacity: 25
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesAnonymousIpList",
          version: "",
          capacity: 50
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesBotControlRuleSet",
          version: "",
          capacity: 50
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
          version: "",
          capacity: 700
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesKnownBadInputsRuleSet",
          version: "",
          capacity: 200
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesSQLiRuleSet",
          version: "",
          capacity: 200
        }
      ]
    },
    PostProcess: {
    },
    Scope: "REGIONAL",
    Type: "AWS::ElasticLoadBalancingV2::LoadBalancer"
  }

};