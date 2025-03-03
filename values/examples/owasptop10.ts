import { WafConfig } from "../../lib/types/config";
import {ManagedRuleGroupVendor, AwsManagedRules, WebAclScope, WebAclTypeEnum} from "../../lib/types/enums/waf";
export const config: WafConfig = {
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
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.AMAZON_IP_REPUTATION_LIST,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.ANONYMOUS_IP_LIST,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.BOT_CONTROL_RULE_SET,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.COMMON_RULE_SET,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.KNOWN_BAD_INPUTS_RULE_SET,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.SQLI_RULE_SET,
        }
      ]
    },
    PostProcess: {
    },
    Scope: WebAclScope.REGIONAL,
    Type: WebAclTypeEnum.ELASTICLOADBALANCINGV2_LOADBALANCER
  }

};