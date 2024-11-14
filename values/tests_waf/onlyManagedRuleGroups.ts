import { WafConfig } from "../../lib/types/config";
import {ManagedRuleGroupVendor, AwsManagedRules, WebAclScope, WebAclTypeEnum} from "../../lib/types/enums/waf";
export const config: WafConfig = {
  General: {
    Prefix: "testcases",
    Stage: "test",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"]
  },
  WebAcl: {
    Name: "ManagedRuleGroups",
    Scope: WebAclScope.REGIONAL,
    Type: WebAclTypeEnum.APIGATEWAY_STAGE,
    IncludeMap: {
      account: [
        "859220371210" // gdn-test
      ],
    },
    PreProcess: {
      ManagedRuleGroups: [
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.AMAZON_IP_REPUTATION_LIST,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.ANONYMOUS_IP_LIST
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.BOT_CONTROL_RULE_SET,
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.COMMON_RULE_SET,
          version: "Version_1.11",
          versionEnabled: true,
          enforceUpdate: true
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.KNOWN_BAD_INPUTS_RULE_SET,
          enforceUpdate: true,
          versionEnabled: false
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.SQLI_RULE_SET,
          version: "Version_2.0",
          versionEnabled: true,
          enforceUpdate: true
        },
        {
          vendorName: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.ADMIN_PROTECTION_RULE_SET,
          enforceUpdate: false,
          versionEnabled: true,
        }
      ]
    },
    PostProcess: {},
  },
};