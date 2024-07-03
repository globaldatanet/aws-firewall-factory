import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_fms as fms } from "aws-cdk-lib";
import { ManagedServiceData, SubVariables } from "./types/fms";
import { getGuidance } from "./tools/helpers/guidance";
import { RuntimeProperties } from "./types/runtimeprops";
import { ShieldConfig } from "./types/config";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export interface shield_props extends cdk.StackProps {
  readonly shieldConfig: ShieldConfig;
  readonly runtimeProperties: RuntimeProperties;
}
export class ShieldStack extends cdk.Stack {
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

    const dashboard = new cloudwatch.Dashboard(this, "ShieldDashboard", {
      dashboardName: `ShieldAdvancedDashboard-${props.shieldConfig.General.Prefix.toUpperCase()}-${
        props.shieldConfig.General.Stage
      }`,
      periodOverride: cloudwatch.PeriodOverride.AUTO,
      start: "-PT24H",
    });

    const REGION = process.env.AWS_REGION || "us-east-1";

    const infoWidget = new cloudwatch.TextWidget({
      markdown: `# 🛡️ Shield Advanced Dashboard\n\n🌎 Region: ${REGION}\n\n💡 Type: Shield Advanced`,
      width: 24,
      height: 4,
    });

    dashboard.addWidgets(infoWidget);

    const metricsAccounts = props.shieldConfig.includeMap?.account || [];
    for (const account of metricsAccounts) {
      const attackBitsPerSecond = new cloudwatch.GraphWidget({
        title: `DDoS Attack Bits Per Second in ${account}`,
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: `SEARCH('{AWS/DDoSProtection,Region,Account} Account="${account}" MetricName="DDoSAttackBitsPerSecond"', 'Sum', 300)`,
            usingMetrics: {},
            searchAccount: account,
            searchRegion: REGION,
            label: "DDoS Attack Bits Per Second",
            color: "#00FF00",
          }),
        ],
        leftYAxis: {
          label: "Bits per Second",
          showUnits: true,
          min: 0,
        },
      });

      const attackPacketsPerSecond = new cloudwatch.GraphWidget({
        title: `DDoS Attack Packets Per Second in ${account}`,
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: `SEARCH('{AWS/DDoSProtection,Region,Account} Account="${account}" MetricName="DDoSAttackPacketsPerSecond"', 'Sum', 300)`,
            usingMetrics: {},
            searchAccount: account,
            searchRegion: REGION,
            label: "DDoS Attack Packets Per Second",
            color: "#00FF00",
          }),
        ],
        leftYAxis: {
          label: "Packets per Second",
          showUnits: true,
          min: 0,
        },
      });

      const ddosDetected = new cloudwatch.GraphWidget({
        title: `DDoS Detected in ${account}`,
        width: 24,
        height: 6,
        left: [
          new cloudwatch.MathExpression({
            expression: `SEARCH('{AWS/DDoSProtection,Region,Account} Account="${account}" MetricName="DDoSDetected"', 'Sum', 300)`,
            usingMetrics: {},
            searchAccount: account,
            searchRegion: REGION,
            label: "DDoS Detected",
            color: "#00FF00",
          }),
        ],
        leftYAxis: {
          label: "Count",
          showUnits: true,
          min: 0,
        },
      });

      dashboard.addWidgets(
        attackBitsPerSecond,
        attackPacketsPerSecond,
        ddosDetected
      );
    }
  }
}
