import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_fms as fms } from "aws-cdk-lib";
import { ManagedServiceData } from "../types/fms";
import { getGuidance } from "../tools/helpers/guidance";
import { RuntimeProperties } from "../types/runtimeprops";
import { ShieldConfig } from "../types/config";
import { ShieldDashboard } from "../constructs/shield_Dashboard/index";

/**
 * @packageDocumentation
 *
 * # AWS Firewall Factory Shield Advanced 
 *
 * @description
 * Specifies the AWS Shield Advanced configuration.

 * This CDK creates a Shield Advanced Stack which will be managed by AWS Firewall Manager.
 *

*/

/**
 * @group Interfaces
 * @description
 * Specifies the Shield Advanced Stack properties.
 * 
 * @param {ShieldConfig} shieldConfig  Variable for a Shield Config.
 * @param {RuntimeProperties} runtimeProperties Variable for Runtime Properties.
 *
 */

export interface ShieldProps extends cdk.StackProps {
   /**
   * Class Variable for a Shield Config.
   */
  readonly shieldConfig: ShieldConfig;
  /**
   * Class Variable for Runtime Properties.
   */
  readonly runtimeProperties: RuntimeProperties;
}
export class ShieldStack extends cdk.Stack {
  readonly oamSinkArn: string = "";
  constructor(scope: Construct, id: string, props: ShieldProps) {
    super(scope, id, props);
    const preProcessRuleGroups: never[] = [];
    const postProcessRuleGroups: never[] = [];
    let loggingConfiguration;
    const managedServiceData: ManagedServiceData = {
      type: "SHIELD_ADVANCED",
      defaultAction: { type: props.shieldConfig.defaultActionType },
      preProcessRuleGroups: preProcessRuleGroups,
      postProcessRuleGroups: postProcessRuleGroups,
      overrideCustomerWebACLAssociation: props.shieldConfig.WebAcl
        .OverrideCustomerWebACLAssociation
        ? props.shieldConfig.WebAcl.OverrideCustomerWebACLAssociation
        : false,
      loggingConfiguration: {
        logDestinationConfigs: [loggingConfiguration || ""],
      },
    };

    if(props.shieldConfig.remediationEnabled ===false){
      getGuidance("remediationNotEnabled", props.runtimeProperties);
    }
    const cfnShieldPolicyProps: fms.CfnPolicyProps = {
      remediationEnabled: props.shieldConfig.remediationEnabled,
      // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_fms.CfnPolicy.html#resourcetype:~:text=fms%2Dpolicy%2Dresourcetags-,resourceType,-%3F
      resourceTypeList: props.shieldConfig.resourceTypeList,
      resourceType: props.shieldConfig.resourceType,
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
    new fms.CfnPolicy(
      this,
      "CfnPolicy",
      cfnShieldPolicyProps
    ); // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it.
    if (props.shieldConfig.General.CreateDashboard === true) {
      new ShieldDashboard(this, "ShieldDashboardConstruct", {
        shieldConfig: {
          General: {
            Prefix: props.shieldConfig.General.Prefix,
            Stage: props.shieldConfig.General.Stage,
          },
          includeMap: props.shieldConfig.includeMap,
        },
      });
    }
  }
}
