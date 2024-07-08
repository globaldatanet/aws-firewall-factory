import { Config } from "../../lib/types/config";
import {ManagedRuleGroupVendor, AwsManagedRules, WebAclScope, WebAclTypeEnum} from "../../lib/types/enums";
export const config: Config = {
  General: {
    Prefix: "testcase",
    Stage: "test",
    S3LoggingBucketName: "aws-firewall-factory1-aws-firewall-factory-logs1",
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
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.AMAZON_IP_REPUTATION_LIST,
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.ANONYMOUS_IP_LIST
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.BOT_CONTROL_RULE_SET,
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.COMMON_RULE_SET,
          version: "Version_1.11",
          versionEnabled: true,
          enforceUpdate: true
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.KNOWN_BAD_INPUTS_RULE_SET,
          enforceUpdate: true,
          versionEnabled: false
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.SQLI_RULE_SET,
          version: "Version_2.0",
          versionEnabled: true,
          enforceUpdate: true
        },
        {
          vendor: ManagedRuleGroupVendor.AWS,
          name: AwsManagedRules.ADMIN_PROTECTION_RULE_SET,
          enforceUpdate: false,
          versionEnabled: true,
        }
      ]
    },
    PostProcess: {},
  },
};