import { App } from "aws-cdk-lib";
import { ShieldStack } from "../lib/_shield-advanced-stack";

const app = new App();
new ShieldStack(app, "shield-cdk-test-props", {
  config: {
    remediationEnabled: true,
    resourceTypeList: [
      "AWS::CloudFront::Distribution",
      "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "AWS::ElasticLoadBalancing::LoadBalancer",
      "AWS::EC2::EIP",
    ],
    resourceType: "AWS::ElasticLoadBalancing::LoadBalancer",
    policyName: "ShieldAdvancedPolicyCdkTest",
    includeMap: { account: ["962355891833"] },
    excludeMap: {},
    excludeResourceTags: false,
  },
});
