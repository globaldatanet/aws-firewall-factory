import { ShieldConfig } from "../../lib/types/config";
export const shieldConfig: ShieldConfig = {
  General: {
    Prefix: "aws-firewall-factory1",
    Stage: "test",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"],
  },
  WebAcl: { OverrideCustomerWebACLAssociation: false },
  defaultActionType:"ALLOW",
  remediationEnabled: false,
  resourceType: "AWS::ElasticLoadBalancing::LoadBalancer",
  policyName: "ACS-FIREWALL-FACTORY-SHIELD-ADVANCED",
  includeMap: { account: ["123456789012"] },
  excludeMap: {},
  excludeResourceTags: false,
};
