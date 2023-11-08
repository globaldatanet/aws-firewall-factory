/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { WAFV2Client, CheckCapacityCommand, CheckCapacityCommandInput, DescribeManagedRuleGroupCommand, DescribeManagedRuleGroupCommandInput, ListAvailableManagedRuleGroupVersionsCommand, Rule as SdkRule, ListAvailableManagedRuleGroupVersionsCommandInput} from "@aws-sdk/client-wafv2";
import * as quota from "@aws-sdk/client-service-quotas";
import * as cloudformation from "@aws-sdk/client-cloudformation";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import { FMSClient, ListPoliciesCommand, ListPoliciesCommandInput } from "@aws-sdk/client-fms";
import * as lodash from "lodash";
import { RuntimeProperties } from "../types/runtimeprops";
import { Config } from "../types/config";
import { Rule as FmsRule } from "../types/fms";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
import cfonts = require("cfonts");
import * as packageJsonObject from "../../package.json";
import {transformCdkRuletoSdkRule} from "./transformer";
import { table } from "table";


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
async function getTotalCapacityOfRules(deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT", rules: SdkRule[]): Promise<number> {
  const client = new WAFV2Client({ region: deploymentRegion });
  const input: CheckCapacityCommandInput = {
    Scope: scope,
    Rules: rules,
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
  let currentQuota = 0;
  const quoataClient = new quota.ServiceQuotasClient({ region: deploymentRegion });
  const input: quota.GetAWSDefaultServiceQuotaCommandInput = {
    QuotaCode: quotaCode,
    ServiceCode: "fms"
  };
  const command = new quota.GetAWSDefaultServiceQuotaCommand(input);
  const responsequoata = await quoataClient.send(command);
  if(responsequoata.Quota?.Adjustable === true){
    const input: quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommandInput = {
      QuotaCode: quotaCode,
      ServiceCode: "fms"
    };
    const command = new quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommand(input);
    const newquota = await quoataClient.send(command);
    if(newquota.RequestedQuotas?.length !== 0){
      if(newquota.RequestedQuotas?.length || 0 === 0){
        const sortquota = lodash.sortBy(newquota.RequestedQuotas,["Created"]);
        if(sortquota?.length === 1){
          if(sortquota?.[0].Status !== "APPROVED"){
            console.log("ℹ️  There is an open Quota request for " + quotaCode + " but it is still not approved using DEFAULT Quota.");
            currentQuota = responsequoata.Quota?.Value || 0;
            return currentQuota;
          }
          if(sortquota?.[0].Status === "APPROVED"){
            currentQuota = sortquota?.[0].DesiredValue  || 0;
            return currentQuota;
          }
        }
      }
      else{
        currentQuota = responsequoata.Quota?.Value || 0;
        return currentQuota;
      }
    }
    else{
      currentQuota = responsequoata.Quota?.Value || 0;
      return currentQuota;
    }
  }
  currentQuota = responsequoata.Quota?.Value || 0;
  return currentQuota;
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
  const stackName = `${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}`;
  const cloudformationClient = new cloudformation.CloudFormationClient({ region: deploymentRegion });
  const params ={
    StackName: stackName
  };
  const command = new cloudformation.DescribeStacksCommand(params);
  try{
    const responsestack = await cloudformationClient.send(command);
    console.log("🫗  Get Outputs from existing CloudFormation Stack.\n");
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
  catch (e){
    console.log("🆕 Creating new CloudFormation Stack.\n");
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
  console.log("\n👀 Get CustomRule Capacity:");
  if (!config.WebAcl.PreProcess.CustomRules) {
    console.log(
      "\n ⏭  Skip Rule Capacity Calculation for PreProcess Custom Rules."
    );
  } else {
    console.log(" 🥇 PreProcess: ");
    runtimeProperties.PreProcess.CustomRuleCount = config.WebAcl.PreProcess.CustomRules.length;
    runtimeProperties.PreProcess.CustomCaptchaRuleCount = config.WebAcl.PreProcess.CustomRules.filter(rule => rule.action.captcha).length;
    runtimeProperties.PreProcess.Capacity = (await calculateCustomRulesCapacities(config.WebAcl.PreProcess.CustomRules, deploymentRegion, config.WebAcl.Scope)).reduce((a,b) => a+b, 0);
  }
  if (!config.WebAcl.PostProcess.CustomRules) {
    console.log(
      "\n ⏭  Skip Rule Capacity Calculation for PostProcess Custom Rules."
    );
  } else {
    console.log("\n 🥈 PostProcess: ");
    runtimeProperties.PostProcess.CustomRuleCount = config.WebAcl.PostProcess.CustomRules.length;
    runtimeProperties.PostProcess.CustomCaptchaRuleCount = config.WebAcl.PostProcess.CustomRules.filter(rule => rule.action.captcha).length;
    runtimeProperties.PostProcess.Capacity = (await calculateCustomRulesCapacities(config.WebAcl.PostProcess.CustomRules, deploymentRegion, config.WebAcl.Scope)).reduce((a,b) => a+b, 0);
  }
  console.log("\n👀 Get ManagedRule Capacity:\n");
  if (!config.WebAcl.PreProcess.ManagedRuleGroups || config.WebAcl.PreProcess.ManagedRuleGroups?.length === 0) {
    console.log("\n ℹ️  No ManagedRuleGroups defined in PreProcess.");
  } else {
    console.log(" 🥇 PreProcess: ");
    const managedcapacitieslog = [];
    managedcapacitieslog.push(["➕ RuleName", "Capacity", "🏷  Specified Version", "🔄 EnforceUpdate"]);
    for (const managedrule of config.WebAcl.PreProcess.ManagedRuleGroups) {
      managedrule.version ? managedrule.version : managedrule.version = await getcurrentManagedRuleGroupVersion(deploymentRegion, managedrule.vendor, managedrule.name, config.WebAcl.Scope);
      const capacity = await getManagedRuleCapacity(
        deploymentRegion,
        managedrule.vendor,
        managedrule.name,
        config.WebAcl.Scope,
        managedrule.version
      );
      managedrule.capacity = capacity;
      managedcapacitieslog.push([managedrule.name, capacity, managedrule.version !== "" ? managedrule.version : "[unversioned]", managedrule.enforceUpdate ?? "false"]);
      runtimeProperties.ManagedRuleCapacity += capacity;
      runtimeProperties.PreProcess.ManagedRuleGroupCount += 1;
      managedrule.name === "AWSManagedRulesBotControlRuleSet" ? runtimeProperties.PreProcess.ManagedRuleBotControlCount +=1 : "";
      managedrule.name === "AWSManagedRulesATPRuleSet" ? runtimeProperties.PreProcess.ManagedRuleATPCount += 1 : "";
    }
    console.log(table(managedcapacitieslog));
  }
  if (!config.WebAcl.PostProcess.ManagedRuleGroups  || config.WebAcl.PostProcess.ManagedRuleGroups?.length === 0) {
    console.log("\n ℹ️  No ManagedRuleGroups defined in PostProcess.");
  } else {
    console.log("\n 🥈 PostProcess: ");
    const managedcapacitieslog = [];
    managedcapacitieslog.push(["➕ RuleName", "Capacity", "🏷  Specified Version", "🔄 EnforceUpdate"]);
    for (const managedrule of config.WebAcl.PostProcess.ManagedRuleGroups) {
      managedrule.version ? managedrule.version : managedrule.version = await getcurrentManagedRuleGroupVersion(deploymentRegion, managedrule.vendor, managedrule.name, config.WebAcl.Scope);
      const capacity = await getManagedRuleCapacity(
        deploymentRegion,
        managedrule.vendor,
        managedrule.name,
        config.WebAcl.Scope,
        managedrule.version
      );
      managedrule.capacity = capacity;
      managedcapacitieslog.push([managedrule.name, managedrule.capacity, managedrule.version !== "" ? managedrule.version : "[unversioned]", managedrule.enforceUpdate ?? "false"]);
      runtimeProperties.ManagedRuleCapacity += capacity;
      runtimeProperties.PostProcess.ManagedRuleGroupCount += 1;
      managedrule.name === "AWSManagedRulesBotControlRuleSet" ? runtimeProperties.PostProcess.ManagedRuleBotControlCount +=1 : "";
      managedrule.name === "AWSManagedRulesATPRuleSet" ? runtimeProperties.PostProcess.ManagedRuleATPCount += 1 : "";
    }
    console.log(table(managedcapacitieslog));
  }
}

/**
 * Filters for AWS Firewall Factory managed IPSets and RegexPatternSets
 * @param statement the statement to check
 * @returns found
 */
function filterStatements(statement: wafv2.CfnWebACL.StatementProperty){
  {
    let found = true;
    const ipSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
    const regexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
    const notStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
    if(ipSetReferenceStatement && !ipSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
    if(regexPatternSetReferenceStatement && !regexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
    if(notStatement) {
      const notStatementProp = notStatement.statement as wafv2.CfnWebACL.StatementProperty;
      const notipSetReferenceStatement = notStatementProp.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
      const notregexPatternSetReferenceStatement = notStatementProp.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
      if(notipSetReferenceStatement && !notipSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
      if(notregexPatternSetReferenceStatement && !notregexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
    }
    return found;
  }
}
/**
 *
 * @param customRules PreProcess Custom Rules or PostProcess Custom Rules
 * @param deploymentRegion the AWS region, e.g. eu-central-1
 * @param scope the scope of the WebACL, e.g. REGIONAL or CLOUDFRONT
 * @returns an array with the capacities of the supplied custom rules
 */
async function calculateCustomRulesCapacities(customRules: FmsRule[], deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT") {
  const capacities = [];
  const capacitieslog = [];
  capacitieslog.push(["🔺 Priority", "➕ RuleName", "Capacity"]);
  for (const customRule of customRules) {
    // Manually calculate and return capacity if rule has a ipset statements with a logical ID entry (e.g. ${IPsString.Arn})
    // This means the IPSet will be created by this repo, maybe it doesn't exists yet. That fails this function. That's why the code below is needed.
    const ipSetReferenceStatement = customRule.statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
    const statementRegexPatternSetsStatement = customRule.statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
    // in case rule has an andStatement
    const andStatement = customRule.statement.andStatement as wafv2.CfnWebACL.AndStatementProperty | undefined;
    // in case rule has an orStatement
    const orStatement = customRule.statement.orStatement as wafv2.CfnWebACL.OrStatementProperty | undefined;
    // in case rule has an notStatement
    const notStatement = customRule.statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
    if(ipSetReferenceStatement && !ipSetReferenceStatement.arn.startsWith("arn:aws:")) {
      // Capacity for IPSet statements:
      // "WCUs – 1 WCU for most. If you configure the statement to use forwarded IP addresses and specify a position of ANY, increase the WCU usage by 4."
      // https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-ipset-match.html
      capacities.push(calculateIpsSetStatementCapacity(ipSetReferenceStatement));
    }
    else if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
      capacities.push(regexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
    }
    else if(notStatement && notStatement.statement) {
      const notStatementProp = notStatement.statement as wafv2.CfnWebACL.StatementProperty;
      const notipSetReferenceStatement = notStatementProp.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
      const notregexPatternSetReferenceStatement = notStatementProp.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
      if(notipSetReferenceStatement && !notipSetReferenceStatement.arn.startsWith("arn:aws:")) {
        capacities.push(calculateIpsSetStatementCapacity(notipSetReferenceStatement));
      }
      else if(notregexPatternSetReferenceStatement && !notregexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) {
        capacities.push(regexPatternSetsStatementsCapacity(notregexPatternSetReferenceStatement));
      }
      else{
        capacities.push(await calculateCustomRuleStatementsCapacity(customRule, deploymentRegion, scope));
      }
    }
    else if(andStatement && andStatement.statements) {
      for (const statement of andStatement.statements as wafv2.CfnWebACL.StatementProperty[]) {
        const statementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
        if(statementIpSetReferenceStatement && !statementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
          capacities.push(calculateIpsSetStatementCapacity(statementIpSetReferenceStatement));
        }
        const statementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
        if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
          capacities.push(regexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
        }
        const notStatementStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
        if(notStatementStatement && notStatementStatement.statement) {
          const statement = notStatementStatement.statement as wafv2.CfnWebACL.StatementProperty;
          const notstatementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
          if(notstatementIpSetReferenceStatement && !notstatementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
            capacities.push(calculateIpsSetStatementCapacity(notstatementIpSetReferenceStatement));
          }
          const notstatementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
          if(notstatementRegexPatternSetsStatement && notstatementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
            capacities.push(regexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement));
          }
        }

      }
      const filteredAndStatements = {
        statements: (andStatement.statements as wafv2.CfnWebACL.StatementProperty[]).filter(statement =>
          filterStatements(statement))};
      if (filteredAndStatements && filteredAndStatements.statements && filteredAndStatements.statements.length > 0) {
        const calcRule = buildCustomRuleWithoutReferenceStatements(customRule, filteredAndStatements, false);
        const capacity = await calculateCustomRuleStatementsCapacity(calcRule, deploymentRegion, scope);
        capacities.push(capacity);
      }
    }
    else if(orStatement && orStatement.statements) {
      for (const statement of orStatement.statements as wafv2.CfnWebACL.StatementProperty[]) {
        const statementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
        if(statementIpSetReferenceStatement && !statementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
          capacities.push(calculateIpsSetStatementCapacity(statementIpSetReferenceStatement));
        }
        const statementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
        if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
          capacities.push(regexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
        }
        const notStatementStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
        if(notStatementStatement && notStatementStatement.statement) {
          const statement = notStatementStatement.statement as wafv2.CfnWebACL.StatementProperty;
          const notstatementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
          if(notstatementIpSetReferenceStatement && !notstatementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
            capacities.push(calculateIpsSetStatementCapacity(notstatementIpSetReferenceStatement));
          }
          const notstatementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
          if(notstatementRegexPatternSetsStatement && notstatementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
            capacities.push(regexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement));
          }
        }
      }
      const filteredOrStatements = {
        statements: (orStatement.statements as wafv2.CfnWebACL.StatementProperty[]).filter(statement =>
          filterStatements(statement))
      };
      if (filteredOrStatements && filteredOrStatements.statements && filteredOrStatements.statements.length > 0) {
        const calcRule = buildCustomRuleWithoutReferenceStatements(customRule, filteredOrStatements, false);
        const capacity = await calculateCustomRuleStatementsCapacity(calcRule, deploymentRegion, scope);
        capacities.push(capacity);
      }
    }
    else {
      capacities.push(await calculateCustomRuleStatementsCapacity(customRule, deploymentRegion, scope));
    }
    capacitieslog.push([customRule.priority, customRule.name,capacities[capacities.length-1]]);
  }
  capacitieslog.sort((a, b) => parseInt(a[0] as string,10) - parseInt(b[0] as string,10));
  console.log(table(capacitieslog));
  return capacities;
}

/**
 * Implementation of the calculation of the capacity for IPSet statements according to https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-ipset-match.html
 * @param ipSetReferenceStatement the IPSetReferenceStatement
 * @returns the capacity of the IPSet statement
 */
function calculateIpsSetStatementCapacity(ipSetReferenceStatement: wafv2.CfnWebACL.IPSetReferenceStatementProperty) {
  let ipSetRuleCapacity = 1;
  const ipSetForwardedIpConfig = ipSetReferenceStatement.ipSetForwardedIpConfig as wafv2.CfnWebACL.IPSetForwardedIPConfigurationProperty | undefined;
  if(ipSetForwardedIpConfig && ipSetForwardedIpConfig.position === "ANY") ipSetRuleCapacity = 4;
  return ipSetRuleCapacity;
}

async function calculateCustomRuleStatementsCapacity(customRule: FmsRule, deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT") {
  const ruleCalculatedCapacityJson = [];
  const rule = transformCdkRuletoSdkRule(customRule);
  ruleCalculatedCapacityJson.push(rule);
  const capacity = await getTotalCapacityOfRules(
    deploymentRegion,
    scope,
    ruleCalculatedCapacityJson
  );
  return capacity;
}


/**
 * Implementation of the calculation of the capacity for regexPatternSets according to https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-regex-pattern-set-match.html
 * @param regexPatternSets the regexPatternSetsStatements
 * @returns the capacity of the regexPatternSets statement
 */
function regexPatternSetsStatementsCapacity(regexPatternSetsStatement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty) {
  let regexRuleCapacity = 0;
  const regexRulebaseCost = 25;
  const regexPatterSetsFieldToMatch = regexPatternSetsStatement.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty | undefined;
  if(regexPatterSetsFieldToMatch && regexPatterSetsFieldToMatch.allQueryArguments) regexRuleCapacity += 10;
  if(regexPatterSetsFieldToMatch && regexPatterSetsFieldToMatch.jsonBody) regexRuleCapacity += (regexRulebaseCost*2); regexRuleCapacity += regexRulebaseCost;
  const regexPattermSetsTextTransformation = regexPatternSetsStatement.textTransformations as wafv2.CfnWebACL.TextTransformationProperty[] | undefined;
  if(regexPattermSetsTextTransformation) {
    for(const textTransformation of regexPattermSetsTextTransformation){
      if(textTransformation.type !== "NONE"){
        regexRuleCapacity +=10;
      }
    }
  }
  return regexRuleCapacity;
}



function buildCustomRuleWithoutReferenceStatements(customRule: FmsRule, concatenatedStatement: wafv2.CfnWebACL.AndStatementProperty | wafv2.CfnWebACL.OrStatementProperty, isOrStatement: boolean) {
  const statements = concatenatedStatement.statements as wafv2.CfnWebACL.StatementProperty[];
  let statement;
  if (statements.length === 1) {
    statement = statements[0];
  } else if (isOrStatement) {
    statement = {
      orStatement: concatenatedStatement
    };
  } else {
    statement = {
      andStatement: concatenatedStatement
    };
  }
  const tempCalcRule : FmsRule = {
    name: customRule.name,
    priority: customRule.priority,
    visibilityConfig: customRule.visibilityConfig,
    ruleLabels: customRule.ruleLabels,
    captchaConfig: customRule.captchaConfig,
    statement,
    action: customRule.action
  };
  return tempCalcRule;
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
  const customCapacity = runtimeProps.PreProcess.Capacity + runtimeProps.PostProcess.Capacity;
  const totalWcu = runtimeProps.PreProcess.Capacity + runtimeProps.PostProcess.Capacity + runtimeProps.ManagedRuleCapacity;
  const quoteWcu = await getFmsQuota(deploymentRegion, WCU_QUOTA_CODE);
  const wcuLimitReached = (totalWcu > Number(quoteWcu));
  if (wcuLimitReached) {
    console.log("\n🔎 Capacity Check result: 🔴 \n  ﹗ Stopping deployment ﹗\n");
    console.log(" 💡 Account WAF-WCU Quota: " +Number(quoteWcu).toString());
    console.log(" 🧮 Calculated Custom Rule Capacity is: [" + customCapacity + "] \n ➕ ManagedRulesCapacity: ["+ runtimeProps.ManagedRuleCapacity +"] \n ＝ Total Waf Capacity: " + totalWcu.toString() + "\n");
  }
  else {
    console.log("\n🔎 Capacity Check result: 🟢 \n");
    console.log(" 💡 Account WAF-WCU Quota: " +Number(quoteWcu).toString());
    console.log(" 🧮 Calculated Custom Rule Capacity is: [" + customCapacity + "] (🥇[" + runtimeProps.PreProcess.Capacity + "] + 🥈[" + runtimeProps.PostProcess.Capacity + "]) \n ➕ ManagedRulesCapacity: ["+ runtimeProps.ManagedRuleCapacity +"] \n ＝ Total Waf Capacity: " + totalWcu.toString() + "\n");
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
export function convertPropValuesToUint8Array(rulesObject: any, propertyName: string): any {
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
export function convertStringToUint8Array(stringToConvert: string): Uint8Array {
  const buf = new ArrayBuffer(stringToConvert.length * 2); // 2 bytes for each char
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = stringToConvert.length; i < strLen; i++) {
    bufView[i] = stringToConvert.charCodeAt(i);
  }
  return bufView;
}


/**
 * Version of the AWS Firewall Factory - extracted from package.json
 */
const FIREWALL_FACTORY_VERSION = packageJsonObject.version;


/**
 * The function will display info banner and returns deploymentRegion for WAF Stack
 * @param config configuration object of the values.json
 * @return deploymentRegion AWS region, e.g. eu-central-1
 */
export const outputInfoBanner = (config?:Config) => {
  /**
   * the region into which the stack is deployed
   */
  let deploymentRegion = "";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  cfonts.say("AWS FIREWALL FACTORY", {font: "block",align: "center",colors: ["#00ecbd"],background: "transparent",letterSpacing: 0,lineHeight: 0,space: true,maxLength: "13",gradient: false,independentGradient: false,transitionGradient: false,env: "node",width:"80%"});
  console.log("\n © by globaldatanet");
  console.log("\n🏷  Version: ","\x1B[1m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
  if(config){
    console.log("\n👤 AWS FMS Administrator Account: ");
    console.log("\x1b[33m",`                        ${process.env.CDK_DEFAULT_ACCOUNT}`,"\x1b[0m");
    if(process.env.PREREQUISITE === "true"){
      console.log("🌎 Deployment region:");
      console.log("\x1b[32m",`                      ${process.env.AWS_REGION}`,"\x1b[0m \n\n");
    }
    else{
      if(config.WebAcl.Scope === "CLOUDFRONT"){
        deploymentRegion = "us-east-1";
      }
      else{
        deploymentRegion = process.env.REGION || "eu-central-1";
      }
      console.log("🌎 CDK deployment region:");
      console.log("\x1b[32m",`                      ${deploymentRegion}`,"\x1b[0m \n");
    }
  }
  return deploymentRegion;
};