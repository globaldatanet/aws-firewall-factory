import { ShieldConfig } from "../../lib/types/config";
export const shieldConfig: ShieldConfig = {
  General: {
    Prefix: "ACS",
    Stage: "tes",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"],
  },
  WebAcl: { OverrideCustomerWebACLAssociation: false },
  defaultActionType:"ALLOW",
  remediationEnabled: false,
  resourceType: "AWS::ElasticLoadBalancing::LoadBalancer",
  policyName: "ACS-FIREWALL-FACTORY-SHIELD-ADVANCED",
  includeMap: { account: ["962355891833"] },
  excludeMap: {},
  excludeResourceTags: false,
};
