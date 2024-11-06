import { waf } from "../../lib/types/config";
import {ManagedRuleGroupVendor, AwsManagedRules, WebAclScope, WebAclTypeEnum, COMMON_RULE_SET_RULES} from "../../lib/types/enums/waf";
export const config: waf.WafConfig = {
  General: {
    Prefix: "testcases",
    Stage: "test",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"]
  },
  WebAcl: {
    Name: "ManagedRuleGroupsExcludes",
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
          name: AwsManagedRules.COMMON_RULE_SET,
          version: "Version_1.11",
          versionEnabled: true,
          enforceUpdate: true,
          excludeRules: [
            {
              name: COMMON_RULE_SET_RULES.SizeRestrictions_BODY,
            },
          ]
        }
      ]
    },
    PostProcess: {},
  },
};