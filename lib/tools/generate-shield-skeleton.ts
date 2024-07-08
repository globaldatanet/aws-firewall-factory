import { ShieldConfig } from "../types/config";
import util from "util";
import { afwfHelper } from "./helpers";

/**
 * The script will output a example WAF Skeleton Config to the terminal
 */

const skeletonConfig : ShieldConfig = {
  General: {
    Prefix: "AFWF",
    Stage: "TEST",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"],
  },
  WebAcl: { OverrideCustomerWebACLAssociation: false },
  defaultActionType:"ALLOW",
  remediationEnabled: true,
  resourceType: "AWS::ElasticLoadBalancing::LoadBalancer",
  policyName: "ACS-FIREWALL-FACTORY-SHIELD-ADVANCED",
  includeMap: { account: ["123456189012"] },
  excludeMap: {},
  excludeResourceTags: false,
};

afwfHelper.outputInfoBanner();
afwfHelper.outputInfoBanner();
console.log("ℹ️  Use the following snippet to create a skeleton config file for your Firewall. ℹ️\n");
console.log("import { ShieldConfig } from \"../../lib/types/config\";\nexport const config: Config = {");
console.log(util.inspect(skeletonConfig, false, null, true));
console.log("};");