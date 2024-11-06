import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { runtime, autoUpdatedManagedIpSets } from "../types/config/index";
import {
  aws_lambda as lambda,
  aws_lambda_nodejs as NodejsFunction,
  aws_ssm as ssm,
  aws_iam as iam,
  aws_events_targets as targets,
  aws_events as events,
  custom_resources as cr,
} from "aws-cdk-lib";
import * as path from "path";
import { regExReplacer } from "../../lib/lambda/SharedComponents/helpers";

export interface AutoUpdatedManagedIpSetsStackProps extends cdk.StackProps {
    /**
   * Class Variable for WAF Properties.
   */
  readonly config: autoUpdatedManagedIpSets.AutoUpdatedManagedIpSetsConfig;
    /**
   * Class Variable for Runtime Properties.
   */
  runtimeProperties: runtime.RuntimeProps;
}



export class AutoUpdatedManagedIpSetsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AutoUpdatedManagedIpSetsStackProps) {
    super(scope, id, props);

    const ManagedIpSetsParameter = new ssm.StringParameter(
      this,
      "ManagedIpSetsParameter",
      {
        parameterName: `/${props.config.General.Prefix.toUpperCase()}/AWS-FIREWALL-FACTORY/MANAGEDIPSETS/CONFIGURATION`,
        stringValue: JSON.stringify(props.config.ManagedIpSets, regExReplacer, 2),
        description: "Auto Updated Managed IP Sets Parameter - © AWS Firewall Factory ",
        tier: ssm.ParameterTier.ADVANCED,
      }
    );
    new cdk.CfnOutput(this, "AWS-Firewall-Factory-ManagedIpSet-Configuration-Parameter", {
      key: "AwsFirewallFactoryManagedIpSetConfigurationParameter",
      exportName: "AwsFirewallFactoryManagedIpSetConfigurationParameter",
      value: ManagedIpSetsParameter.parameterName,
      description: "Auto Updated Managed IP Sets Parameter - © AWS Firewall Factory ",
    });
    const awsFirewallFactoryIpSetManager = new NodejsFunction.NodejsFunction(
      this,
      "AwsFirewallFactoryIpSetManager",
      {
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(
          __dirname,
          "../lambda/AutoUpdatedManagedIpSets/index.ts"
        ),
        handler: "handler",
        timeout: cdk.Duration.seconds(360),
        environment: {
          PARAM_NAME: ManagedIpSetsParameter.parameterName,
        },
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        bundling: {
          minify: true,
        },
        description:
          "Lambda Function to manage the Auto Updated Managed IP Sets",
      }
    );
    ManagedIpSetsParameter.grantRead(awsFirewallFactoryIpSetManager);
    const wafIpSetManagement = new iam.PolicyStatement({ // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      actions:["wafv2:ListIpSets","wafv2:CreateIPSet","wafv2:UpdateIPSet","wafv2:DeleteIPSet", "wafv2:GetIPSet"],
      resources: ["*"]});
    awsFirewallFactoryIpSetManager.addToRolePolicy(wafIpSetManagement);
    const ssmParameterManagement = new iam.PolicyStatement({ // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      actions:["ssm:PutParameter",
        "ssm:DeleteParameter"],
      resources: [`arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/${props.config.General.Prefix.toUpperCase()}/AWS-FIREWALL-FACTORY/MANAGEDIPSETS/*/ADDRESSES`, `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter/${props.config.General.Prefix.toUpperCase()}/AWS-FIREWALL-FACTORY/MANAGEDIPSETS/*`]});
    awsFirewallFactoryIpSetManager.addToRolePolicy(ssmParameterManagement);
    const ssmParameterGet = new iam.PolicyStatement({ // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      actions:["ssm:DescribeParameters",
        "ssm:ListParameters"],
      resources: ["*"]});
    awsFirewallFactoryIpSetManager.addToRolePolicy(ssmParameterGet);
    const cloudwatchMetric = new iam.PolicyStatement({ // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      actions:["cloudwatch:PutMetricData"],
      resources: ["*"]});
    awsFirewallFactoryIpSetManager.addToRolePolicy(cloudwatchMetric);
    const autoUpdatedManagedIpSetProvider = new cr.Provider(this, "CustomResourceProviderAwsFirewallFactoryIpSetManagerLambda", { // NOSONAR -> SonarQube is identitfying this line as a Major Issue, but it is not. Sonarqube identify the following Error: Either remove this useless object instantiation or use it. 
      onEventHandler: awsFirewallFactoryIpSetManager
    });


    for (const ipSet of props.config.ManagedIpSets) {
      const autoUpdatedManagedIpSetCustomResource = new cdk.CustomResource(this, `AWS-Firewall-Factory-CustomResource-${ipSet.name}`, {
        serviceToken: autoUpdatedManagedIpSetProvider.serviceToken,
        properties: {
          IpSetName: ipSet.name,
          Region: ipSet.region,
          Scope: ipSet.scope,
          Prefix: props.config.General.Prefix,
        },
      });

      new cdk.CfnOutput(this, `AWS-Firewall-Factory-ManagedIpSet-${ipSet.name}`, {
        key: `${ipSet.name.replace(/[^0-9a-z]/gi, "")}Arn`,
        exportName: `${ipSet.name}Arn`,
        value: autoUpdatedManagedIpSetCustomResource.getAttString("IpSetArn"),
        description: "Autoupdated Managed IP Set ARN from aws-firewall-factory",
      });

      new events.Rule(this, `aws-firewall-factory-${ipSet.name}-Rule`, {
        ruleName: `${props.config.General.Prefix}-aws-firewall-factory-${ipSet.name}-UpdateRule`,
        schedule: ipSet.updateSchedule,
        targets: [new targets.LambdaFunction(awsFirewallFactoryIpSetManager, {
          event: events.RuleTargetInput.fromObject({
            Type: "aws-firewall-factory-IpSetUpdate",
            ResourceProperties: {
              IpSetName: ipSet.name,
              Region: ipSet.region,
              Scope: ipSet.scope,
              Prefix: props.config.General.Prefix,
            },
          }),
        })],
      });
    }




  }
}