import { Config } from "../types/config";
import util from "util";
import { outputInfoBanner } from "./helpers";

const skeletonConfig : Config = {
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
    Description: "myWAF-Description",
    PreProcess: {
      ManagedRuleGroups: [
        {
          vendor: "AWS",
          name: "AWSManagedRulesAmazonIpReputationList",
          capacity: 25,
          version: ""
        },
        {
          vendor: "AWS",
          name: "AWSManagedRulesCommonRuleSet",
          capacity: 700,
          version: "",
        }
      ]
    },
    PostProcess: {

    },
    Scope: "REGIONAL",
    Type: "AWS::ElasticLoadBalancingV2::LoadBalancer"
  }
};

outputInfoBanner();
console.log("ℹ️  Use the following snippet to create a skeleton config file for your Firewall. ℹ️\n");
console.log("import { Config } from \"../../lib/types/config\";\nexport const config: Config = {");
console.log(util.inspect(skeletonConfig, false, null, true));
console.log("};");