import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_fms as fms } from "aws-cdk-lib";
import { ManagedServiceData, SubVariables } from "./types/fms";
import { getGuidance } from "./tools/helpers/guidance";
import { RuntimeProperties } from "./types/runtimeprops";
import { ShieldConfig } from "./types/config";
import { ShieldDashboard } from "./constructs/ShieldDashboard";
import { CrossAccountSink } from "./constructs/CrossAccountSink";

export interface shield_props extends cdk.StackProps {
  readonly shieldConfig: ShieldConfig;
  readonly runtimeProperties: RuntimeProperties;
}
export class ShieldStack extends cdk.Stack {
  readonly oamSinkArn: string;

  constructor(scope: Construct, id: string, props: shield_props) {
    super(scope, id, props);
    // const cfnShieldPolicyProps: fms.CfnPolicyProps = {
    //   // remediationEnabled - should be true
    //   remediationEnabled: props.remediationEnabled,
    //   // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#resourcetype:~:text=fms%2Dpolicy%2Dresourcetags-,resourceType,-%3F
    //   resourceTypeList:props.resourceTypeList,
    //   resourceType: props.resourceType,
    //   policyName: props.policyName,
    //   includeMap: props.includeMap,
    //   excludeMap: props.excludeMap,
    //   excludeResourceTags: props.excludeResourceTags,
    //   //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#:~:text=Specification%20for%20SHIELD_ADVANCED%20for%20Amazon%20CloudFront%20distributions
    //   securityServicePolicyData: props.securityServicePolicyData,
    // };
    const preProcessRuleGroups: never[] = [];
    const postProcessRuleGroups: never[] = [];
    let loggingConfiguration;
    const managedServiceData: ManagedServiceData = {
      type: "SHIELD_ADVANCED",
      defaultAction: { type: props.shieldConfig.defaultActionType },
      preProcessRuleGroups: preProcessRuleGroups,
      postProcessRuleGroups: postProcessRuleGroups,
      // overrideCustomerWebACLAssociation: false,
      overrideCustomerWebACLAssociation: props.shieldConfig.WebAcl
        .OverrideCustomerWebACLAssociation
        ? props.shieldConfig.WebAcl.OverrideCustomerWebACLAssociation
        : false,
      loggingConfiguration: {
        logDestinationConfigs: [loggingConfiguration || ""],
      },
    };

    props.shieldConfig.remediationEnabled === false
      ? getGuidance("remediationNotEnabled", props.runtimeProperties)
      : null;
    const cfnShieldPolicyProps: fms.CfnPolicyProps = {
      // remediationEnabled - should be true
      remediationEnabled: props.shieldConfig.remediationEnabled,
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#resourcetype:~:text=fms%2Dpolicy%2Dresourcetags-,resourceType,-%3F
      resourceTypeList: props.shieldConfig.resourceTypeList,
      resourceType: props.shieldConfig.resourceType,
      // policyName: props.shieldConfig.policyName,
      policyName: `${props.shieldConfig.General.Prefix.toUpperCase()}-${
        props.shieldConfig.General.Stage
      }`,
      includeMap: props.shieldConfig.includeMap,
      excludeMap: props.shieldConfig.excludeMap,
      excludeResourceTags: props.shieldConfig.excludeResourceTags,
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

    if (props.shieldConfig.General.CreateDashboard === true) {
      if (!props.shieldConfig.General.OrganizationId) {
        console.error(
          "\u001B[31m",
          "🚨 ERROR: Exit process due to missing Organization ID which is required for cross account CloudWatch link 🚨 \n\n",
          "\x1b[0m" + "\n\n"
        );
        process.exit(1);
      }

      new ShieldDashboard(this, "ShieldDashboardConstruct", {
        shieldConfig: {
          General: {
            Prefix: props.shieldConfig.General.Prefix,
            Stage: props.shieldConfig.General.Stage,
          },
          includeMap: props.shieldConfig.includeMap,
        },
      });

      // new CrossAccountSink(this, "CrossAccountSinkConstruct", {
      //   principalOrgID: props.shieldConfig.General.OrganizationId,
      //   sinkName: `${props.shieldConfig.General.Prefix}-${props.shieldConfig.General.Stage}-ShieldAdvancedSink`,
      // });
    }
  }
}
