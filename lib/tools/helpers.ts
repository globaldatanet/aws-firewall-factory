import { WAFV2Client, CheckCapacityCommand, CheckCapacityCommandInput, DescribeManagedRuleGroupCommand, DescribeManagedRuleGroupCommandInput, ListAvailableManagedRuleGroupVersionsCommand, ListAvailableManagedRuleGroupVersionsCommandInput } from "@aws-sdk/client-wafv2";
import * as quota from "@aws-sdk/client-service-quotas";
import * as cloudformation from "@aws-sdk/client-cloudformation";
import { FMSClient, ListPoliciesCommand, ListPoliciesCommandInput } from "@aws-sdk/client-fms";
import { Rule } from "../types/fms";
import * as lodash from "lodash";
import { RuntimeProperties } from "../types/runtimeprops";
import { Config } from "../types/config";
/**
 * Service Quota Code for Firewall Manager Total WAF WCU in account & region
 */
const WCU_QUOTA_CODE = "L-D86ED2F3";

/**
 * Service Quota Code for Firewall Manager policies per organization per Region
 */
const POLICY_QUOTA_CODE = "L-0B28E140";

/**
 * Get the current count of security policies in the deployment account and region
 * @param deploymentRegion
 * @returns A promise with the current policy count
 */
async function getPolicyCount(deploymentRegion: string): Promise<number> {
  const client = new FMSClient({ region: deploymentRegion });
  const input: ListPoliciesCommandInput = {
  };
  const command = new ListPoliciesCommand(input);
  const response = await client.send(command);
  return response.PolicyList?.length || 0;
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param scope whether scope is REGIONAL or CLOUDFRONT
 * @param rules rules for which you want to calculate the capacity
 * @returns the total capacity of the supplied rules
 */
async function getTotalCapacityOfRules(deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT", rules: Rule[]): Promise<number> {
  const client = new WAFV2Client({ region: deploymentRegion });
  const input: CheckCapacityCommandInput = {
    Scope: scope,
    Rules: convertPropValuesToUint8Array(rules, "SearchString")
  };
  const command = new CheckCapacityCommand(input);
  const response : any = await client.send(command);
  return response.Capacity || 0;
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param quotaCode AWS Quota Code for the FMS Service Quota
 * @returns returns the specified quota of the FMS Service
 */
async function getFmsQuota(deploymentRegion: string, quotaCode: string): Promise<number>{
  let current_quota = 0;
  const quoata_client = new quota.ServiceQuotasClient({ region: deploymentRegion });
  const input: quota.GetAWSDefaultServiceQuotaCommandInput = {
    QuotaCode: quotaCode,
    ServiceCode: "fms"
  };
  const command = new quota.GetAWSDefaultServiceQuotaCommand(input);
  const responsequoata = await quoata_client.send(command);
  if(responsequoata.Quota?.Adjustable === true){
    const input: quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommandInput = {
      QuotaCode: quotaCode,
      ServiceCode: "fms"
    };
    const command = new quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommand(input);
    const newquota = await quoata_client.send(command);
    if(newquota.RequestedQuotas?.length !== 0){
      if(newquota.RequestedQuotas?.length || 0 === 0){
        const sortquota = lodash.sortBy(newquota.RequestedQuotas,["Created"]);
        if(sortquota?.length === 1){
          if(sortquota?.[0].Status !== "APPROVED"){
            console.log("ℹ️  There is an open Quota request for " + quotaCode + " but it is still not approved using DEFAULT Quota.");
            current_quota = responsequoata.Quota?.Value || 0;
            return current_quota;
          }
          if(sortquota?.[0].Status === "APPROVED"){
            current_quota = sortquota?.[0].DesiredValue  || 0;
            return current_quota;
          }
        }
      }
      else{
        current_quota = responsequoata.Quota?.Value || 0;
        return current_quota;
      }
    }
    else{
      current_quota = responsequoata.Quota?.Value || 0;
      return current_quota;
    }
  }
  current_quota = responsequoata.Quota?.Value || 0;
  return current_quota;
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param vendor vendor of the Managed Rule Group
 * @param rgName vame of the Managed Rule Group
 * @param scope whether scope is REGIONAL or CLOUDFRONT
 * @param version version of the Managed Rule Group
 * @returns returns the capacity of the Managed Rule Group
 */
async function getManagedRuleCapacity(deploymentRegion: string, vendor: string, rgName: string, scope: string, version: string): Promise<number>{
  const client = new WAFV2Client({ region: deploymentRegion });
  if(version === ""){
    const input: DescribeManagedRuleGroupCommandInput = {
      VendorName: vendor,
      Name: rgName,
      Scope: scope
    };
    const command = new DescribeManagedRuleGroupCommand(input);
    const response: any = await client.send(command);
    return response.Capacity || 0;
  }
  else{
    const input: DescribeManagedRuleGroupCommandInput = {
      VendorName: vendor,
      Name: rgName,
      Scope: scope,
      VersionName: version
    };
    const command = new DescribeManagedRuleGroupCommand(input);
    const response : any = await client.send(command);
    return response.Capacity || 0;
  }
}


/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param vendor vendor of the Managed Rule Group
 * @param rgName vame of the Managed Rule Group
 * @param scope whether scope is REGIONAL or CLOUDFRONT
 * @returns returns the CurrentDefaultVersion of the Managed Rule Group
 */
export async function getcurrentManagedRuleGroupVersion(deploymentRegion: string, vendor: string, rgName: string, scope: string): Promise<string>{
  const client = new WAFV2Client({ region: deploymentRegion});
  const input: ListAvailableManagedRuleGroupVersionsCommandInput = {
    VendorName: vendor,
    Name: rgName,
    Scope: scope,
    Limit: 5,
  };
  const command = new ListAvailableManagedRuleGroupVersionsCommand(input);
  const response: any = await client.send(command);
  if(response.Versions.length > 0){
    return response.Versions[0].Name;
  }
  else{
    return "";
  }
}
/**
 * Writes outputs from an existing stack into the specified runtime props
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param runtimeprops runtime properties, where to write stack outputs into
 * @param config the config object from the values json
 */
export async function setOutputsFromStack(deploymentRegion: string, runtimeprops: RuntimeProperties, config: Config): Promise<void>{
  const StackName =
  config.General.Prefix.toUpperCase() +
  "-WAF-" +
  config.WebAcl.Name.toUpperCase() +
  "-" +
  config.General.Stage.toUpperCase() +
  "-" +
  config.General.DeployHash.toUpperCase();

  const cloudformation_client = new cloudformation.CloudFormationClient({ region: deploymentRegion });
  const params ={
    StackName
  };
  const command = new cloudformation.DescribeStacksCommand(params);
  const responsestack = await cloudformation_client.send(command);
  if(responsestack.Stacks?.[0].StackName && responsestack.Stacks?.[0].Outputs !== undefined){
    for(const output of responsestack.Stacks?.[0]?.Outputs ?? []){
      if(output.OutputKey === "DeployedRuleGroupNames")
      {
        runtimeprops.PreProcess.DeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || [];
      }
      else if(output.OutputKey === "DeployedRuleGroupIdentifier")
      {
        runtimeprops.PreProcess.DeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || [];
      }
      else if(output.OutputKey === "DeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        runtimeprops.PreProcess.DeployedRuleGroupCapacities = arrayOfNumbers;
      }
      if(output.OutputKey === "PreProcessDeployedRuleGroupNames")
      {
        runtimeprops.PreProcess.DeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || [];
      }
      else if(output.OutputKey === "PreProcessDeployedRuleGroupIdentifier")
      {
        runtimeprops.PreProcess.DeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || [];
      }
      else if(output.OutputKey === "PreProcessDeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        runtimeprops.PreProcess.DeployedRuleGroupCapacities = arrayOfNumbers;
      }
      if(output.OutputKey === "PostProcessDeployedRuleGroupNames")
      {
        runtimeprops.PostProcess.DeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || [];
      }
      else if(output.OutputKey === "PostProcessDeployedRuleGroupIdentifier")
      {
        runtimeprops.PostProcess.DeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || [];
      }
      else if(output.OutputKey === "PostProcessDeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        runtimeprops.PostProcess.DeployedRuleGroupCapacities = arrayOfNumbers;
      }
    }
  }
}

/**
 * calculate the capacities for managed and custom rules and apply them to runtime properties
 * @param config configuration object of the values.json
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param runtimeProperties runtime properties object, where to store capacities
 */
async function calculateCapacities(
  config: Config,
  deploymentRegion: string,
  runtimeProperties: RuntimeProperties
): Promise<void> {

  let count = 0;
  if (!config.WebAcl.PreProcess.CustomRules) {
    console.log(
      "\n ⏭  Skip Rule Capacity Calculation for PreProcess Custom Rules."
    );
  } else {
    while (count < config.WebAcl.PreProcess.CustomRules.length) {
      runtimeProperties.PreProcess.CustomRuleCount += 1;
      if ("Captcha" in config.WebAcl.PreProcess.CustomRules[count].Action) {
        runtimeProperties.PreProcess.CustomCaptchaRuleCount += 1;
        const rules : Rule[] = [];
        const { CloudWatchMetricsEnabled, SampledRequestsEnabled } =
          config.WebAcl.PreProcess.CustomRules[count].VisibilityConfig;
        const rule: Rule = {
          Statement: config.WebAcl.PreProcess.CustomRules[count].Statement,
          Name: "Rule",
          Action: config.WebAcl.PreProcess.CustomRules[count].Action,
          CaptchaConfig:
            config.WebAcl.PreProcess.CustomRules[count].CaptchaConfig,
          VisibilityConfig: {
            CloudWatchMetricsEnabled,
            SampledRequestsEnabled,
            MetricName: "Metric" + Math.random().toString(),
          },
        };
        if (config.WebAcl.PreProcess.CustomRules[count].RuleLabels) {
          rule.RuleLabels =
            config.WebAcl.PreProcess.CustomRules[count].RuleLabels;
        }
        rules.push(rule);
        const capacity = await getTotalCapacityOfRules(
          deploymentRegion,
          config.WebAcl.Scope,
          rules
        );
        runtimeProperties.PreProcess.RuleCapacities.push(capacity);
      } else {
        const rule_calculated_capacity_json = [];
        const { CloudWatchMetricsEnabled, SampledRequestsEnabled } =
          config.WebAcl.PreProcess.CustomRules[count].VisibilityConfig;
        const temp_template: Rule = {
          Statement: config.WebAcl.PreProcess.CustomRules[count].Statement,
          Name: "Rule",
          Action: config.WebAcl.PreProcess.CustomRules[count].Action,
          VisibilityConfig: {
            CloudWatchMetricsEnabled,
            SampledRequestsEnabled,
            MetricName: "Metric" + Math.random().toString(),
          },
        };
        if (config.WebAcl.PreProcess.CustomRules[count].RuleLabels) {
          temp_template.RuleLabels =
            config.WebAcl.PreProcess.CustomRules[count].RuleLabels;
        }
        rule_calculated_capacity_json.push(temp_template);
        const capacity = await getTotalCapacityOfRules(
          deploymentRegion,
          config.WebAcl.Scope,
          rule_calculated_capacity_json
        );
        runtimeProperties.PreProcess.RuleCapacities.push(capacity);
      }
      count++;
    }
    runtimeProperties.PreProcess.Capacity = runtimeProperties.PreProcess.RuleCapacities.reduce(
      function (a, b) {
        return a + b;
      },
      0
    );
  }
  count = 0;
  let PostProcessCapacity = 0;
  if (!config.WebAcl.PostProcess.CustomRules) {
    console.log(
      "\n ⏭  Skip Rule Capacity Calculation for PostProcess Custom Rules."
    );
  } else {
    while (count < config.WebAcl.PostProcess.CustomRules.length) {
      runtimeProperties.PostProcess.CustomRuleCount += 1;
      const rule_calculated_capacity_json = [];
      const { CloudWatchMetricsEnabled, SampledRequestsEnabled } =
        config.WebAcl.PostProcess.CustomRules[count].VisibilityConfig;
      const rule: Rule = {
        Statement: config.WebAcl.PostProcess.CustomRules[count].Statement,
        Name: "Rule",
        Action: config.WebAcl.PostProcess.CustomRules[count].Action,
        VisibilityConfig: {
          CloudWatchMetricsEnabled,
          SampledRequestsEnabled,
          MetricName: "Metric" + Math.random().toString(),
        },
      };
      if ("Captcha" in config.WebAcl.PostProcess.CustomRules[count].Action) {
        runtimeProperties.PostProcess.CustomCaptchaRuleCount += 1;
        rule.CaptchaConfig =
          config.WebAcl.PostProcess.CustomRules[count].CaptchaConfig;
      }
      if (config.WebAcl.PostProcess.CustomRules[count].RuleLabels) {
        rule.RuleLabels =
          config.WebAcl.PostProcess.CustomRules[count].RuleLabels;
      }
      rule_calculated_capacity_json.push(rule);
      const capacity = await getTotalCapacityOfRules(
        deploymentRegion,
        config.WebAcl.Scope,
        rule_calculated_capacity_json
      );
      runtimeProperties.PostProcess.RuleCapacities.push(capacity);
      count++;
    }
    PostProcessCapacity = runtimeProperties.PostProcess.RuleCapacities.reduce(
      function (a, b) {
        return a + b;
      },
      0
    );
  }
  console.log("\n👀 Get ManagedRule Capacity:\n");
  if (!config.WebAcl.PreProcess.ManagedRuleGroups) {
    console.log("\n ℹ️  No ManagedRuleGroups defined in PreProcess.");
  } else {
    console.log(" 🥇 PreProcess: ");
    for (const managedrule of config.WebAcl.PreProcess.ManagedRuleGroups) {
      managedrule.Version ? managedrule.Version : managedrule.Version = await getcurrentManagedRuleGroupVersion(deploymentRegion, managedrule.Vendor, managedrule.Name, config.WebAcl.Scope);
      const capacity = await getManagedRuleCapacity(
        deploymentRegion,
        managedrule.Vendor,
        managedrule.Name,
        config.WebAcl.Scope,
        managedrule.Version
      );
      managedrule.Capacity = capacity;
      console.log(
        "   ➕ Capacity for " +
          managedrule.Name +
          " is [" +
          managedrule.Capacity +
          "]"
      );
      managedrule.Version ? console.log("      🏷  Latest " + managedrule.Version) : console.log("");
      runtimeProperties.ManagedRuleCapacity += capacity;
      runtimeProperties.PreProcess.ManagedRuleGroupCount += 1;
      managedrule.Name === "AWSManagedRulesBotControlRuleSet" ? runtimeProperties.PreProcess.ManagedRuleBotControlCount +=1 : "";
      managedrule.Name === "AWSManagedRulesATPRuleSet" ? runtimeProperties.PreProcess.ManagedRuleATPCount += 1 : "";
    }
  }
  if (!config.WebAcl.PostProcess.ManagedRuleGroups) {
    console.log("\n ℹ️  No ManagedRuleGroups defined in PostProcess.");
  } else {
    console.log("\n 🥈 PostProcess: ");
    for (const managedrule of config.WebAcl.PostProcess.ManagedRuleGroups) {
      managedrule.Version ? managedrule.Version : managedrule.Version = await getcurrentManagedRuleGroupVersion(deploymentRegion, managedrule.Vendor, managedrule.Name, config.WebAcl.Scope);
      const capacity = await getManagedRuleCapacity(
        deploymentRegion,
        managedrule.Vendor,
        managedrule.Name,
        config.WebAcl.Scope,
        managedrule.Version
      );
      managedrule.Capacity = capacity;
      console.log(
        "   ➕ Capacity for " +
          managedrule.Name +
          " is [" +
          managedrule.Capacity +
          "]"
      );
      managedrule.Version ? console.log("      🏷  Latest " + managedrule.Version) : console.log("");
      runtimeProperties.ManagedRuleCapacity += capacity;
      runtimeProperties.PostProcess.ManagedRuleGroupCount += 1;
      managedrule.Name === "AWSManagedRulesBotControlRuleSet" ? runtimeProperties.PostProcess.ManagedRuleBotControlCount +=1 : "";
      managedrule.Name === "AWSManagedRulesATPRuleSet" ? runtimeProperties.PostProcess.ManagedRuleATPCount += 1 : "";
    }
  }
  runtimeProperties.PostProcess.Capacity = PostProcessCapacity;
}

/**
 * The functiion calculates the current security policy count in the account & region and checks if exceeds the current quota
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @returns whether policy limit is reached
 */
export async function isPolicyQuotaReached(deploymentRegion: string): Promise<boolean> {
  const policyCount = await getPolicyCount(deploymentRegion);
  const fmsPolicyQuota = await getFmsQuota(deploymentRegion, POLICY_QUOTA_CODE);
  const policyLimitReached = fmsPolicyQuota <= policyCount;
  if (policyLimitReached) {
    console.log(
      "\n🚨 You are about to exceed the limit for Policies per region.\n Region Quota: " +
        fmsPolicyQuota +
        "\n Deployed Policies: " +
        policyCount +
        "\n ﹗ Stopping deployment ﹗"
    );
  }
  return policyLimitReached;
}

/**
 * The function checks if the total WCU of all configured rules exceeds the WCU quota in account & region
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param runtimeProps runtime properties object, where to store capacities
 * @param config configuration object of the values.json
 * @returns whether WCU limit is reached
 */
export async function isWcuQuotaReached(deploymentRegion: string, runtimeProps: RuntimeProperties, config: Config): Promise<boolean> {
  await calculateCapacities(config, deploymentRegion, runtimeProps);
  const custom_capacity = runtimeProps.PreProcess.Capacity + runtimeProps.PostProcess.Capacity;
  const total_wcu = runtimeProps.PreProcess.Capacity + runtimeProps.PostProcess.Capacity + runtimeProps.ManagedRuleCapacity;
  const quote_wcu = await getFmsQuota(deploymentRegion, WCU_QUOTA_CODE);
  const wcuLimitReached = (total_wcu > Number(quote_wcu));
  if (wcuLimitReached) {
    console.log("\n🔎 Capacity Check result: 🔴 \n  ﹗ Stopping deployment ﹗\n");
    console.log(" 💡 Account WAF-WCU Quota: " +Number(quote_wcu).toString());
    console.log(" 🧮 Calculated Custom Rule Capacity is: [" + custom_capacity + "] \n ➕ ManagedRulesCapacity: ["+ runtimeProps.ManagedRuleCapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n");
  }
  else {
    console.log("\n🔎 Capacity Check result: 🟢 \n");
    console.log(" 💡 Account WAF-WCU Quota: " +Number(quote_wcu).toString());
    console.log(" 🧮 Calculated Custom Rule Capacity is: [" + custom_capacity + "] (🥇[" + runtimeProps.PreProcess.Capacity + "] + 🥈[" + runtimeProps.PostProcess.Capacity + "]) \n ➕ ManagedRulesCapacity: ["+ runtimeProps.ManagedRuleCapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n");
  }
  return wcuLimitReached;
}

/**
 * initialize a runtime properties object
 * @returns the runtime properties object
 */
export function initRuntimeProperties() : RuntimeProperties {
  return {
    ManagedRuleCapacity: 0,
    PostProcess: {
      Capacity: 0,
      DeployedRuleGroupCapacities: [],
      DeployedRuleGroupIdentifier: [],
      DeployedRuleGroupNames: [],
      RuleCapacities: [],
      ManagedRuleGroupCount: 0,
      ManagedRuleBotControlCount: 0,
      ManagedRuleATPCount: 0,
      CustomRuleCount: 0,
      CustomRuleGroupCount: 0,
      CustomCaptchaRuleCount: 0
    },
    PreProcess: {
      Capacity: 0,
      DeployedRuleGroupCapacities: [],
      DeployedRuleGroupIdentifier: [],
      DeployedRuleGroupNames: [],
      RuleCapacities: [],
      ManagedRuleGroupCount: 0,
      ManagedRuleBotControlCount: 0,
      ManagedRuleATPCount: 0,
      CustomRuleCount: 0,
      CustomRuleGroupCount: 0,
      CustomCaptchaRuleCount: 0
    },
    Pricing: {
      Policy: 0,
      Rule: 0,
      WebACL: 0,
      Request: 0,
      BotControl: 0,
      BotControlRequest: 0,
      Captcha: 0,
      AccountTakeoverPrevention: 0,
      AccountTakeoverPreventionRequest: 0,
      Dashboard: 0
    }
  };
}

/**
 * The function converts the value of all properties with supplied name into a Uint8Array
 * @param rulesObject Rules Object or Array of Rules Object
 * @param propertyName name of the properties which have to be converted
 * @returns converted Rules
 */
function convertPropValuesToUint8Array(rulesObject: any, propertyName: string): any {
  const convertedObject: any = {};
  let value: any;
  if (rulesObject instanceof Array) {
    return rulesObject.map(function (value) {
      if (typeof value === "object") {
        value = convertPropValuesToUint8Array(value, propertyName);
      }
      return value;
    });
  } else {
    for (const origKey in rulesObject) {
      if (Object.prototype.hasOwnProperty.call(rulesObject,origKey)) {
        value = rulesObject[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = convertPropValuesToUint8Array(value, propertyName);
        }
        if (origKey === propertyName) {
          value = convertStringToUint8Array(rulesObject[origKey]);
        }
        convertedObject[origKey] = value;
      }
    }
  }
  return convertedObject;
}

/**
 * The function returns Uint8 representation of a string
 * @param stringToConvert string which has to be converted to Uint8Array
 * @returns the desired Uint8Array representation of the string
 */
function convertStringToUint8Array(stringToConvert: string): Uint8Array {
  const buf = new ArrayBuffer(stringToConvert.length * 2); // 2 bytes for each char
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = stringToConvert.length; i < strLen; i++) {
    bufView[i] = stringToConvert.charCodeAt(i);
  }
  return bufView;
}

/**
 * Function to transform property names into camel case like AWS needs it
 * @param o object which property names has to be transformed to camel case
 * @returns the object with the transformed property names in camel case
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function toAwsCamel(o: any): any {
  let newO: any, origKey: any, newKey: any, value: any;
  if (o instanceof Array) {
    return o.map(function(value) {
      if (typeof value === "object") {
        value = toAwsCamel(value);
      }
      if(value === "aRN"){
        value = "arn";
      }
      if(value === "iPSetReferenceStatement"){
        value = "ipSetReferenceStatement";
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (Object.prototype.hasOwnProperty.call(o, origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString();
        if(newKey === "aRN"){
          newKey = "arn";
        }
        if(newKey === "iPSetReferenceStatement"){
          newKey = "ipSetReferenceStatement";
        }
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toAwsCamel(value);
          if(value === "aRN"){
            value = "arn";
          }
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
}