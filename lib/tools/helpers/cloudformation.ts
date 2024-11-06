import * as cloudformation from "@aws-sdk/client-cloudformation";
import { waf, runtime } from "../../types/config/index";


/** Puts specified output values into the runtimeprops - this function is needed to identify chagend WCUs of WAF RuleGroups
   * @param propertyName name of the property to write to eg.: DeployedRuleGroupNames
   * @param runtimeProps runtime properties, where to write stack outputs into
   * @param cloudformationOutputName name of the cloudformation output to get eg.: PreProcessDeployedRuleGroupNames
   * @param describeStacksCommandOutput the output of the CloudFormation describeStacksCommand
   */
// eslint-disable-next-line no-inner-declarations
function processOutputsToProcessProperties<K extends keyof runtime.ProcessProperties>(
  propertyName: K,
  runtimeProps: runtime.ProcessProperties,
  cloudformationOutputName: string,
  describeStacksCommandOutput: cloudformation.DescribeStacksCommandOutput){

  const outputValue = describeStacksCommandOutput.Stacks?.[0]?.Outputs?.find(output => output.OutputKey === cloudformationOutputName)?.OutputValue || "";
  if(propertyName === "DeployedRuleGroupNames" || propertyName === "DeployedRuleGroupIdentifier"){
    Object.assign(runtimeProps,{ [propertyName]: outputValue.split(",", outputValue.length) as runtime.ProcessProperties[K] });
  }
  if(propertyName === "DeployedRuleGroupCapacities"){
    Object.assign(runtimeProps,{ [propertyName]: outputValue?.split(",",outputValue?.length).map(Number) as runtime.ProcessProperties[K] });
  }
}


/**
 * Writes outputs from an existing stack into the specified runtime props
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param runtimeprops runtime properties, where to write stack outputs into
 * @param config the config object from the values ts
 */
export async function setOutputsFromStack(deploymentRegion: string, runtimeProps: runtime.RuntimeProps, config: waf.WafConfig): Promise<void> {
  const stackName = `${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-" + config.General.DeployHash.toUpperCase() : ""}`;
  const cloudformationClient = new cloudformation.CloudFormationClient({ region: deploymentRegion });
  const params = {
    StackName: stackName
  };

  const command = new cloudformation.DescribeStacksCommand(params);

  try {
    const responseStack = await cloudformationClient.send(command);

    console.log("🫗  Get Outputs from existing CloudFormation Stack.\n");
    processOutputsToProcessProperties("DeployedRuleGroupNames", runtimeProps.PreProcess, "PreProcessDeployedRuleGroupNames", responseStack);
    processOutputsToProcessProperties("DeployedRuleGroupIdentifier", runtimeProps.PreProcess, "PreProcessDeployedRuleGroupIdentifier", responseStack);
    processOutputsToProcessProperties("DeployedRuleGroupCapacities", runtimeProps.PreProcess, "PreProcessDeployedRuleGroupCapacities", responseStack);
    processOutputsToProcessProperties("DeployedRuleGroupNames", runtimeProps.PostProcess, "PostProcessDeployedRuleGroupNames", responseStack);
    processOutputsToProcessProperties("DeployedRuleGroupIdentifier", runtimeProps.PostProcess,"PostProcessDeployedRuleGroupIdentifier", responseStack);
    processOutputsToProcessProperties("DeployedRuleGroupCapacities", runtimeProps.PostProcess, "PostProcessDeployedRuleGroupCapacities", responseStack);

  } catch {
    console.log("🆕 Creating new CloudFormation Stack.\n");
  }
}

/**
 * Get deployed ManagedRuleGroup outputs from an existing stack into the specified runtime props
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param config the config object from the values ts
 * @param name the name of the output to get eg.: (AWSManagedRulesCommonRuleSetVersion)
 */
export async function getManagedRuleGroupVersionFromStack(deploymentRegion: string, config: waf.WafConfig, name: string): Promise<string | undefined> {
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
  catch {
    return undefined;
  }
}
