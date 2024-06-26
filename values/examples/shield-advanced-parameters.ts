import { ShieldConfig } from "../../lib/types/config";
export const shieldConfig: ShieldConfig = {
  General: {
    Prefix: "ACS",
    Stage: "test",
    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
    LoggingConfiguration: "S3",
    SecuredDomain: ["test.aws-firewall-factory.com"],
  },
  WebAcl: { OverrideCustomerWebACLAssociation: false },
  defaultActionType:"ALLOW",
  remediationEnabled: true,
  resourceTypeList: [
    "AWS::CloudFront::Distribution",
    "AWS::ElasticLoadBalancingV2::LoadBalancer",
    "AWS::ElasticLoadBalancing::LoadBalancer",
    "AWS::EC2::EIP",
  ],
  resourceType: "AWS::ElasticLoadBalancing::LoadBalancer",
  policyName: "ACS-FIREWALL-FACTORY-SHIELD-ADVANCED",
  includeMap: { account: ["962355891833"] },
  excludeMap: {},
  excludeResourceTags: false,
};
