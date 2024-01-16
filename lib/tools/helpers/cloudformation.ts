import * as cloudformation from "@aws-sdk/client-cloudformation";
import { RuntimeProperties, ProcessProperties } from "../../types/runtimeprops";
import { Config } from "../../types/config";

/**
 * Writes outputs from an existing stack into the specified runtime props
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param runtimeprops runtime properties, where to write stack outputs into
 * @param config the config object from the values ts
 */
export async function setOutputsFromStack(deploymentRegion: string, runtimeProps: RuntimeProperties, config: Config): Promise<void> {
  const stackName = `${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-" + config.General.DeployHash.toUpperCase() : ""}`;
  const cloudformationClient = new cloudformation.CloudFormationClient({ region: deploymentRegion });
  const params = {
    StackName: stackName
  };

  const command = new cloudformation.DescribeStacksCommand(params);

  try {
    const responseStack = await cloudformationClient.send(command);
    console.log("🫗  Get Outputs from existing CloudFormation Stack.\n");

    const processOutput = (outputKey: string, target: ProcessProperties) => {
      const outputValue = responseStack.Stacks?.[0]?.Outputs?.find(output => output.OutputKey === outputKey)?.OutputValue || "";
      target.DeployedRuleGroupNames = outputValue.split(",", outputValue.length) || [];
    };

    processOutput("DeployedRuleGroupNames", runtimeProps.PreProcess);
    processOutput("DeployedRuleGroupIdentifier", runtimeProps.PreProcess);
    processOutput("DeployedRuleGroupCapacities", runtimeProps.PreProcess);

    processOutput("PreProcessDeployedRuleGroupNames", runtimeProps.PreProcess);
    processOutput("PreProcessDeployedRuleGroupIdentifier", runtimeProps.PreProcess);
    processOutput("PreProcessDeployedRuleGroupCapacities", runtimeProps.PreProcess);

    processOutput("PostProcessDeployedRuleGroupNames", runtimeProps.PostProcess);
    processOutput("PostProcessDeployedRuleGroupIdentifier", runtimeProps.PostProcess);
    processOutput("PostProcessDeployedRuleGroupCapacities", runtimeProps.PostProcess);

  } catch (e) {
    console.log("🆕 Creating new CloudFormation Stack.\n");
  }
}

/**
 * Get deployed ManagedRuleGroup outputs from an existing stack into the specified runtime props
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param config the config object from the values ts
 * @param name the name of the output to get eg.: (AWSManagedRulesCommonRuleSetVersion)
 */
export async function getManagedRuleGroupVersionFromStack(deploymentRegion: string, config: Config, name: string): Promise<string | undefined> {
  const stackName = `${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-" + config.General.DeployHash.toUpperCase() : ""}`;
  const cloudformationClient = new cloudformation.CloudFormationClient({ region: deploymentRegion });
  const params = {
    StackName: stackName
  };

  const command = new cloudformation.DescribeStacksCommand(params);
  try {
    const responseStack = await cloudformationClient.send(command);
    const outputValue = responseStack.Stacks?.[0]?.Outputs?.find(output => output.OutputKey === name+"Version")?.OutputValue || "";
    return outputValue;
  }
  catch (e) {
    return undefined;
  }
}
