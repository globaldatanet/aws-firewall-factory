import { wafConfig } from "../types/config";
import util from "util";
import { afwfHelper } from "./helpers";
import {ManagedRuleGroupVendor, AwsManagedRules, WebAclScope, WebAclTypeEnum} from "../../lib/types/enums";
/**
 * The script will output a example WAF Skeleton Config to the terminal
 */

const skeletonConfig : wafConfig = {
  General: {
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
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.AMAZON_IP_REPUTATION_LIST,
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.COMMON_RULE_SET,
        }
      ]
    },
    PostProcess: {

    },
    Scope: WebAclScope.REGIONAL,
    Type: WebAclTypeEnum.ELASTICLOADBALANCINGV2_LOADBALANCER
  }
};

afwfHelper.outputInfoBanner();
console.log("ℹ️  Use the following snippet to create a skeleton config file for your Firewall. ℹ️\n");
console.log("import {ManagedRuleGroupVendor, AwsManagedRules, WebAclScope, WebAclTypeEnum} from \"../../lib/types/enums\";");
console.log("import { Config } from \"../../lib/types/config\";\nexport const config: Config = {");
console.log(util.inspect(skeletonConfig, false, null, true));
console.log("};");