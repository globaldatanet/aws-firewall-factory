import { App } from "aws-cdk-lib";
import { ShieldStack } from "../lib/_shield-advanced-stack";
import * as cdk from "aws-cdk-lib";
const app = new App();
import { ManagedServiceData, SubVariables } from "../lib/types/fms";

const preProcessRuleGroups: never[] = [];
const postProcessRuleGroups: never[] = [];
let loggingConfiguration;
const managedServiceData: ManagedServiceData = {
  type: "SHIELD_ADVANCED",
  defaultAction: { type: "ALLOW" },
  preProcessRuleGroups: preProcessRuleGroups,
  postProcessRuleGroups: postProcessRuleGroups,
  overrideCustomerWebACLAssociation: false,
  loggingConfiguration: {
    logDestinationConfigs: [loggingConfiguration || ""],
  },
};
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
    securityServicePolicyData: {
      type: "SHIELD_ADVANCED",
      managedServiceData: cdk.Fn.sub(JSON.stringify(managedServiceData), {}),
    },
  },
});
