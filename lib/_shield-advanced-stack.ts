import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites } from "./types/config";
import { RuntimeProperties } from "./types/runtimeprops";
import { aws_fms as fms } from "aws-cdk-lib";

export interface StackProps extends cdk.StackProps {
  readonly prerequisites: Prerequisites;
  runtimeProperties: RuntimeProperties;
}

// GLobal vs region-specific
export enum ShieldTypes {
  LOAD_BALANCER = "LOAD_BALANCER",
  CLOUDFRONT = "CLOUDFRONT",
}

export interface ResourceTypePerRegion {
  type: ShieldTypes;
  regions: string[];
}

export interface ShieldAccount {
  accountId: string;
  resourceTypePerRegion: ResourceTypePerRegion[];
}

export interface propsaaaa extends cdk.StackProps {
  accounts: ShieldAccount[];
}

const shieldProps = {
  accounts: [
    {
      accountId: "123456789012",
      resourceTypePerRegion: [
        {
          type: ShieldTypes.LOAD_BALANCER,
          regions: ["us-east-1", "us-west-2"],
        },
        {
          type: ShieldTypes.CLOUDFRONT,
          regions: ["global"],
        },
      ],
    },
  ],
};

export class Shiedajbfka extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // props - accounts and regions (global + specific) (map keys resourcetype, region, ?account?)

    // might be unnecessary
    const managedServiceData: ManagedServiceData = {
      type: "WAFV2",
      defaultAction: { type: "ALLOW" },
      preProcessRuleGroups: preProcessRuleGroups,
      postProcessRuleGroups: postProcessRuleGroups,
      overrideCustomerWebACLAssociation: props.config.WebAcl
        .OverrideCustomerWebACLAssociation
        ? props.config.WebAcl.OverrideCustomerWebACLAssociation
        : false,
      loggingConfiguration: {
        logDestinationConfigs: [loggingConfiguration || ""],
      },
    };
    const cfnPolicyProps = {
      // remediationEnabled - should be true
      remediationEnabled: props.config.WebAcl.RemediationEnabled
        ? props.config.WebAcl.RemediationEnabled
        : false,
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#resourcetype:~:text=fms%2Dpolicy%2Dresourcetags-,resourceType,-%3F
      resourceType: props.config.WebAcl.Type,
      resourceTypeList: props.config.WebAcl.TypeList ?? undefined,
      policyName: `${props.config.General.Prefix.toUpperCase()}-${
        props.config.WebAcl.Name
      }-${props.config.General.Stage}${
        props.config.General.DeployHash
          ? "-" + props.config.General.DeployHash
          : ""
      }`,
      includeMap: props.config.WebAcl.IncludeMap,
      excludeMap: props.config.WebAcl.ExcludeMap,

      //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#:~:text=Specification%20for%20SHIELD_ADVANCED%20for%20Amazon%20CloudFront%20distributions
      securityServicePolicyData: {
        type: "WAFV2",
        managedServiceData: cdk.Fn.sub(
          JSON.stringify(managedServiceData),
          subVariables
        ),
      },
      resourcesCleanUp: props.config.WebAcl.ResourcesCleanUp
        ? props.config.WebAcl.ResourcesCleanUp
        : false,
      resourceTags: props.config.WebAcl.ResourceTags,
      excludeResourceTags: props.config.WebAcl.ExcludeResourceTags
        ? props.config.WebAcl.ExcludeResourceTags
        : false,
      policyDescription: props.config.WebAcl.Description ?? undefined,
    };

    const fmspolicy = new fms.CfnPolicy(this, "CfnPolicy", cfnPolicyProps); // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it.
    if (ipSets.length !== 0) {
      for (const ipSet of ipSets) {
        fmspolicy.addDependency(ipSet);
      }
    }
  }
}
