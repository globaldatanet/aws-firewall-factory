import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites } from "./types/config";
import { RuntimeProperties } from "./types/runtimeprops";
import { aws_fms as fms } from "aws-cdk-lib";
import { ManagedServiceData, SubVariables } from "./types/fms";

// export interface StackProps extends cdk.StackProps {
//   readonly prerequisites: Prerequisites;
//   runtimeProperties: RuntimeProperties;
// }

// // GLobal vs region-specific
// export enum ShieldTypes {
//   LOAD_BALANCER = "LOAD_BALANCER",
//   CLOUDFRONT = "CLOUDFRONT",
// }

// export interface ResourceTypePerRegion {
//   type: ShieldTypes;
//   regions: string[];
// }

// export interface ShieldAccount {
//   accountId: string;
//   resourceTypePerRegion: ResourceTypePerRegion[];
// }

// export interface shield_props extends cdk.StackProps {
//   accounts: ShieldAccount[];
//  
// }
// 
// const shieldProps: shield_props = {
//   accounts: [
//     {
//       accountId: "123456789012",
//       resourceTypePerRegion: [
//         {
//           type: ShieldTypes.LOAD_BALANCER,
//           regions: ["us-east-1", "us-west-2"],
//         },
//         {
//           type: ShieldTypes.CLOUDFRONT,
//           regions: ["global"],
//         },
//       ],
//     },
//   ],
//   cfnpolicy: cfnShieldPolicyProps
// };

export interface shield_props extends cdk.StackProps {
  resourceType: string;
}
export class ShieldStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: shield_props ) {
    super(scope, id, props);

    // might be unnecessary
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
    const cfnShieldPolicyProps: fms.CfnPolicyProps = {
      // remediationEnabled - should be true
      remediationEnabled: true,
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#resourcetype:~:text=fms%2Dpolicy%2Dresourcetags-,resourceType,-%3F
      resourceTypeList: [
        "AWS::CloudFront::Distribution",
        "AWS::ElasticLoadBalancingV2::LoadBalancer",
        "AWS::ElasticLoadBalancing::LoadBalancer",
        "AWS::EC2::EIP",
      ],
      resourceType: props.resourceType,
      policyName: "ShieldAdvancedPolicyCdkTest",
      includeMap: { account: ["962355891833"] },
      excludeMap: {},
      excludeResourceTags: false,
      //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#:~:text=Specification%20for%20SHIELD_ADVANCED%20for%20Amazon%20CloudFront%20distributions
      securityServicePolicyData: {
        type: "SHIELD_ADVANCED",
        managedServiceData: cdk.Fn.sub(JSON.stringify(managedServiceData), {}),
      },
    };

    const fmspolicy = new fms.CfnPolicy(
      this,
      "CfnPolicy",
      cfnShieldPolicyProps
    ); // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it.
  }
}
