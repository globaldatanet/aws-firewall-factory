import { table } from "table";
import * as quota from "@aws-sdk/client-service-quotas";
import { Scope, WAFV2Client, CheckCapacityCommand, CheckCapacityCommandInput, CheckCapacityCommandOutput, DescribeManagedRuleGroupCommand, DescribeManagedRuleGroupCommandInput,DescribeManagedRuleGroupCommandOutput, Rule as SdkRule} from "@aws-sdk/client-wafv2";
import { FMSClient, ListPoliciesCommand, ListPoliciesCommandInput } from "@aws-sdk/client-fms";
import { RuntimeProperties, ProcessProperties } from "../../../types/runtimeprops";
import { wafConfig } from "../../../types/config";
import { cloudformationHelper, guidanceHelper } from "../../helpers";
import * as lodash from "lodash";
import {transformCdkRuletoSdkRule} from "../../transformer";
import { Rule as FmsRule, ManagedRuleGroup } from "../../../types/fms";
import { aws_wafv2 as wafv2 } from "aws-cdk-lib";
import {getcurrentManagedRuleGroupVersion} from "./rulegroups";

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
 * @param config Config
 * @param runtimeProperties RuntimeProperties
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param scope whether scope is REGIONAL or CLOUDFRONT
 * @param rules rules for which you want to calculate the capacity
 * @returns the total capacity of the supplied rules
 */
async function getTotalCapacityOfRules(config: wafConfig, runtimeProperties: RuntimeProperties, deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT", rules: SdkRule[]): Promise<number> {
  const client = new WAFV2Client({ region: deploymentRegion });
  if(scope === "CLOUDFRONT"){
    scope = Scope.CLOUDFRONT;
  }else{
    scope = Scope.REGIONAL;
  }
  const input: CheckCapacityCommandInput = {
    Scope: scope,
    Rules: rules,
  };
  const command = new CheckCapacityCommand(input);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response : CheckCapacityCommandOutput = await client.send(command);
    return response.Capacity || 0;
  } catch(err) {
    guidanceHelper.outputGuidance(runtimeProperties, config);
    console.log();
    console.log("🚨 Error in checking capacity of rules!");
    console.log();
    console.log("ℹ️ The following rule failed:");
    console.log(JSON.stringify(input, null, 2));
    console.log();

    throw err;
  }
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param quotaCode AWS Quota Code for the FMS Service Quota
 * @returns returns the specified quota of the FMS Service
 */
async function getFmsQuota(deploymentRegion: string, quotaCode: string): Promise<number> {
  const quotaClient = new quota.ServiceQuotasClient({ region: deploymentRegion });

  const defaultQuotaInput: quota.GetAWSDefaultServiceQuotaCommandInput = {
    QuotaCode: quotaCode,
    ServiceCode: "fms",
  };
  const defaultQuotaCommand = new quota.GetAWSDefaultServiceQuotaCommand(defaultQuotaInput);
  const defaultQuotaResponse = await quotaClient.send(defaultQuotaCommand);

  if (defaultQuotaResponse.Quota?.Adjustable === true) {
    const requestedQuotaInput: quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommandInput = {
      QuotaCode: quotaCode,
      ServiceCode: "fms",
    };
    const requestedQuotaCommand = new quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommand(requestedQuotaInput);
    const requestedQuotaResponse = await quotaClient.send(requestedQuotaCommand);

    if (requestedQuotaResponse.RequestedQuotas?.length !== 0) {
      const sortedQuotas = lodash.sortBy(requestedQuotaResponse.RequestedQuotas, ["Created"]);

      if (sortedQuotas?.length === 1) {
        if (sortedQuotas?.[0].Status !== "APPROVED") {
          console.log(`ℹ️  There is an open Quota request for ${quotaCode} but it is still not approved using DEFAULT Quota.`);
        } else {
          return sortedQuotas?.[0].DesiredValue || 0;
        }
      }
    }

    return defaultQuotaResponse.Quota?.Value || 0;
  }

  return defaultQuotaResponse.Quota?.Value || 0;
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
async function getManagedRuleCapacity(deploymentRegion: string, vendor: string, rgName: string, scope: "REGIONAL" | "CLOUDFRONT", version: string | undefined): Promise<number>{
  const client = new WAFV2Client({ region: deploymentRegion });
  if(scope === "CLOUDFRONT"){
    scope = Scope.CLOUDFRONT;
  } else{
    scope = Scope.REGIONAL;
  }
  if(version === undefined){
    const input: DescribeManagedRuleGroupCommandInput = {
      VendorName: vendor,
      Name: rgName,
      Scope: scope
    };
    const command = new DescribeManagedRuleGroupCommand(input);
    const response: DescribeManagedRuleGroupCommandOutput = await client.send(command);
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
    const response: DescribeManagedRuleGroupCommandOutput = await client.send(command);
    return response.Capacity || 0;
  }
}


/**
 * calculate the capacities for managed and custom rules and apply them to runtime properties
 * @param config configuration object of the values.json
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param runtimeProperties runtime properties object, where to store capacities
 */
async function calculateCapacities(
  config: wafConfig,
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
    runtimeProperties.PreProcess.Capacity = (await calculateCustomRulesCapacities(config, config.WebAcl.PreProcess.CustomRules, deploymentRegion, config.WebAcl.Scope, runtimeProperties)).reduce((a,b) => a+b, 0);
  }
  if (!config.WebAcl.PostProcess.CustomRules) {
    console.log(
      "\n ⏭  Skip Rule Capacity Calculation for PostProcess Custom Rules."
    );
  } else {
    console.log("\n 🥈 PostProcess: ");
    runtimeProperties.PostProcess.CustomRuleCount = config.WebAcl.PostProcess.CustomRules.length;
    runtimeProperties.PostProcess.CustomCaptchaRuleCount = config.WebAcl.PostProcess.CustomRules.filter(rule => rule.action.captcha).length;
    runtimeProperties.PostProcess.Capacity = (await calculateCustomRulesCapacities(config, config.WebAcl.PostProcess.CustomRules, deploymentRegion, config.WebAcl.Scope, runtimeProperties)).reduce((a,b) => a+b, 0);
  }
  console.log("\n👀 Get ManagedRule Capacity:\n");
  if (!config.WebAcl.PreProcess.ManagedRuleGroups || config.WebAcl.PreProcess.ManagedRuleGroups?.length === 0) {
    console.log("\n ℹ️  No ManagedRuleGroups defined in PreProcess.");
  } else {
    console.log(" 🥇 PreProcess: ");
    await calculateManagedRuleGroupCapacities("Pre",deploymentRegion, config, runtimeProperties);
  }
  if (!config.WebAcl.PostProcess.ManagedRuleGroups  || config.WebAcl.PostProcess.ManagedRuleGroups?.length === 0) {
    console.log("\n ℹ️  No ManagedRuleGroups defined in PostProcess.");
  } else {
    console.log("\n 🥈 PostProcess: ");
    await calculateManagedRuleGroupCapacities("Post",deploymentRegion, config, runtimeProperties);
  }
}

/**
 * Calculate Managed Rule Group Capacities
 * @param type "Pre" | "Post"
 * @param deploymentRegion string
 * @param config Config
 * @param runtimeProperties RuntimeProperties
 */
async function calculateManagedRuleGroupCapacities(type: "Pre" | "Post",deploymentRegion:string, config: wafConfig, runtimeProperties: RuntimeProperties): Promise<void> {
  let managedrules: ManagedRuleGroup[] = [];
  let processProperties: ProcessProperties;
  switch(type){
    case "Pre":
      managedrules = config.WebAcl.PreProcess.ManagedRuleGroups ?? [];
      processProperties = runtimeProperties.PreProcess;
      break;
    case "Post":
      managedrules = config.WebAcl.PostProcess.ManagedRuleGroups ?? [];
      processProperties = runtimeProperties.PostProcess;
      break;
  }
  if(config.WebAcl.PreProcess.ManagedRuleGroups === undefined && config.WebAcl.PostProcess.ManagedRuleGroups === undefined ){
    guidanceHelper.getGuidance("noManageRuleGroups", runtimeProperties);
  }
  const managedcapacitieslog = [];
  managedcapacitieslog.push(["➕ RuleName", "Capacity", "🏷  Specified Version", "🔄 EnforceUpdate"]);
  for (const managedrule of managedrules) {
    const enforceUpdate = managedrule.enforceUpdate ?? false;
    if(!enforceUpdate && managedrule.version === undefined) {
      const version = await cloudformationHelper.getManagedRuleGroupVersionFromStack(deploymentRegion, config, managedrule.name);
      if(version){
        managedrule.version = version;
      }
    }
    const ruleversion = managedrule.version ?? await getcurrentManagedRuleGroupVersion(deploymentRegion, managedrule.vendorName, managedrule.name, config.WebAcl.Scope);
    const capacity = await getManagedRuleCapacity(
      deploymentRegion,
      managedrule.vendorName,
      managedrule.name,
      config.WebAcl.Scope,
      ruleversion
    );
    managedrule.capacity = capacity;
    managedcapacitieslog.push([managedrule.name, capacity, ruleversion ?? "[unversioned]", enforceUpdate]);
    runtimeProperties.ManagedRuleCapacity += capacity;
    processProperties.ManagedRuleGroupCount += 1;
    switch(managedrule.name){
      case "AWSManagedRulesBotControlRuleSet": {
        processProperties.ManagedRuleBotControlCount +=1;
        break;
      }
      case "AWSManagedRulesATPRuleSet": {
        processProperties.ManagedRuleATPCount += 1;
        break;
      }
      case "AWSManagedRulesAmazonIpReputationList": {
        processProperties.IpReputationListCount += 1;
        break;
      }
    }
  }
  console.log(table(managedcapacitieslog));
}
/**
   * Filter for instructions IPSets and RegexPatternSets managed by the AWS Firewall Factory to insert the corresponding reference into the statement
   * @param statement the statement to check
   * @returns found
   */
function filterStatements(statement: wafv2.CfnWebACL.StatementProperty){
  {
    let found = true;
    const ipSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
    const regexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
    const notStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
    const orStatement = statement.orStatement as wafv2.CfnWebACL.OrStatementProperty | undefined;
    if(ipSetReferenceStatement && !ipSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
    if(regexPatternSetReferenceStatement && !regexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
    if(notStatement) {
      const notStatementProp = notStatement.statement as wafv2.CfnWebACL.StatementProperty;
      const notipSetReferenceStatement = notStatementProp.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
      const notregexPatternSetReferenceStatement = notStatementProp.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
      if(notipSetReferenceStatement && !notipSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
      if(notregexPatternSetReferenceStatement && !notregexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
    }
    if(orStatement){
      const orStatementProp = orStatement.statements as wafv2.CfnWebACL.StatementProperty[];
      for(const statement of orStatementProp){
        const orStatementPropIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
        const orStatementPropRegexPatternSetReferenceStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
        if(orStatementPropIpSetReferenceStatement && !orStatementPropIpSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
        if(orStatementPropRegexPatternSetReferenceStatement && !orStatementPropRegexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) found = false;
      }
    }
    return found;
  }
}
/**
   * 
   * @param config Config
   * @param customRules PreProcess Custom Rules or PostProcess Custom Rules
   * @param deploymentRegion the AWS region, e.g. eu-central-1
   * @param scope the scope of the WebACL, e.g. REGIONAL or CLOUDFRONT
   * @returns an array with the capacities of the supplied custom rules
   */
async function calculateCustomRulesCapacities(config: wafConfig, customRules: FmsRule[], deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT", runtimeProperties: RuntimeProperties) {
  const capacities = [];
  const capacitieslog = [];
  capacitieslog.push(["🔺 Priority", "➕ RuleName", "🧮 Capacity", "ℹ StatementType"]);
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
    // in case rule has an rateBasedStatement
    const rateBasedStatement = customRule.statement.rateBasedStatement as wafv2.CfnWebACL.RateBasedStatementProperty | undefined;
    if(ipSetReferenceStatement && !ipSetReferenceStatement.arn.startsWith("arn:aws:")) {
      // Capacity for IPSet statements:
      // "WCUs – 1 WCU for most. If you configure the statement to use forwarded IP addresses and specify a position of ANY, increase the WCU usage by 4."
      // https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-ipset-match.html
      capacities.push(calculateIpsSetStatementCapacity(ipSetReferenceStatement));
    }
    else if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
      capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
    }
    else if(notStatement && notStatement.statement) {
      const notStatementProp = notStatement.statement as wafv2.CfnWebACL.StatementProperty;
      const notipSetReferenceStatement = notStatementProp.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
      const notregexPatternSetReferenceStatement = notStatementProp.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
      if(notipSetReferenceStatement && !notipSetReferenceStatement.arn.startsWith("arn:aws:")) {
        capacities.push(calculateIpsSetStatementCapacity(notipSetReferenceStatement));
      }
      else if(notregexPatternSetReferenceStatement && !notregexPatternSetReferenceStatement.arn.startsWith("arn:aws:")) {
        capacities.push(calculateRegexPatternSetsStatementsCapacity(notregexPatternSetReferenceStatement));
      }
      else{
        capacities.push(await calculateCustomRuleStatementsCapacity(config, customRule, deploymentRegion, scope, runtimeProperties));
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
          capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
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
            capacities.push(calculateRegexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement));
          }
        }
        const orStatementStatement = statement.orStatement as wafv2.CfnWebACL.OrStatementProperty | undefined;
        if(orStatementStatement && orStatementStatement.statements) {
          const statementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
          if(statementIpSetReferenceStatement && !statementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
            capacities.push(calculateIpsSetStatementCapacity(statementIpSetReferenceStatement));
          }
          const statementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
          if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
            capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
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
              capacities.push(calculateRegexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement));
            }
          }
        }
  
      }
      const filteredAndStatements = {
        statements: (andStatement.statements as wafv2.CfnWebACL.StatementProperty[]).filter(statement =>
          filterStatements(statement))};
      if (filteredAndStatements && filteredAndStatements.statements && filteredAndStatements.statements.length > 0) {
        const calcRule = buildCustomRuleWithoutReferenceStatements(customRule, filteredAndStatements, false);
        const capacity = await calculateCustomRuleStatementsCapacity(config, calcRule, deploymentRegion, scope, runtimeProperties);
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
          capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement));
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
            capacities.push(calculateRegexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement));
          }
        }
      }
      const filteredOrStatements = {
        statements: (orStatement.statements as wafv2.CfnWebACL.StatementProperty[]).filter(statement =>
          filterStatements(statement))
      };
      if (filteredOrStatements && filteredOrStatements.statements && filteredOrStatements.statements.length > 0) {
        const calcRule = buildCustomRuleWithoutReferenceStatements(customRule, filteredOrStatements, true);
        const capacity = await calculateCustomRuleStatementsCapacity(config, calcRule, deploymentRegion, scope, runtimeProperties);
        capacities.push(capacity);
      }
    }
    else if(rateBasedStatement && rateBasedStatement.scopeDownStatement as wafv2.CfnWebACL.StatementProperty) {
      const scopeDownStatement = rateBasedStatement.scopeDownStatement as wafv2.CfnWebACL.StatementProperty | undefined;
      if(scopeDownStatement){
      // in case rule has an andStatement
        const andStatement = scopeDownStatement.andStatement as wafv2.CfnWebACL.AndStatementProperty | undefined;
        // in case rule has an orStatement
        const orStatement = scopeDownStatement.orStatement as wafv2.CfnWebACL.OrStatementProperty | undefined;
        // in case rule has an notStatement
        const notStatement = scopeDownStatement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
        // in case rule has an ipSetReferenceStatement
        const ipSetReferenceStatement = scopeDownStatement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
        // in case rule has an regexPatternSetReferenceStatement
        const regexPatternSetsStatement = scopeDownStatement.regexMatchStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
        if(andStatement && andStatement.statements) {
          for (const statement of andStatement.statements as wafv2.CfnWebACL.StatementProperty[]) {
            const statementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
            if(statementIpSetReferenceStatement && !statementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
              const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
              capacities.push(calculateIpsSetStatementCapacity(statementIpSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
            }
            const statementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
            if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
              const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
              capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
            }
            const notStatementStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
            if(notStatementStatement && notStatementStatement.statement) {
              const statement = notStatementStatement.statement as wafv2.CfnWebACL.StatementProperty;
              const notstatementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
              if(notstatementIpSetReferenceStatement && !notstatementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
                const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
                capacities.push(calculateIpsSetStatementCapacity(notstatementIpSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
              }
              const notstatementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
              if(notstatementRegexPatternSetsStatement && notstatementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
                capacities.push(calculateRegexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement));
              }
            }
          }
          const filteredAndStatements = {
            statements: (andStatement.statements as wafv2.CfnWebACL.StatementProperty[]).filter(statement =>
              filterStatements(statement))};
          if (filteredAndStatements && filteredAndStatements.statements && filteredAndStatements.statements.length > 0) {
            const calcRule = buildCustomRuleWithoutReferenceStatements(customRule, filteredAndStatements, false);
            const capacity = await calculateCustomRuleStatementsCapacity(config, calcRule, deploymentRegion, scope, runtimeProperties);
            capacities.push(capacity);
          }
        }
        else if(orStatement && orStatement.statements) {
          for (const statement of orStatement.statements as wafv2.CfnWebACL.StatementProperty[]) {
            const statementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
            if(statementIpSetReferenceStatement && !statementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
              const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
              capacities.push(calculateIpsSetStatementCapacity(statementIpSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
            }
            const statementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
            if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
              const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
              capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
            }
            const notStatementStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
            if(notStatementStatement && notStatementStatement.statement) {
              const statement = notStatementStatement.statement as wafv2.CfnWebACL.StatementProperty;
              const notstatementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
              if(notstatementIpSetReferenceStatement && !notstatementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
                const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
                capacities.push(calculateIpsSetStatementCapacity(notstatementIpSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
              }
              const notstatementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
              if(notstatementRegexPatternSetsStatement && notstatementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
                const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
                capacities.push(calculateRegexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
              }
            }
          }
          const filteredOrStatements = {
            statements: (orStatement.statements as wafv2.CfnWebACL.StatementProperty[]).filter(statement =>
              filterStatements(statement))
          };
          if (filteredOrStatements && filteredOrStatements.statements && filteredOrStatements.statements.length > 0) {
            const calcRule = buildCustomRuleWithoutReferenceStatements(customRule, filteredOrStatements, true);
            const capacity = await calculateCustomRuleStatementsCapacity(config, calcRule, deploymentRegion, scope, runtimeProperties);
            capacities.push(capacity);
          }
        }
        else if(notStatement && notStatement.statement) {
          const statement = notStatement.statement as wafv2.CfnWebACL.StatementProperty;
          const statementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
          if(statementIpSetReferenceStatement && !statementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
            const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
            capacities.push(calculateIpsSetStatementCapacity(statementIpSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
          }
          const statementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
          if(statementRegexPatternSetsStatement && !statementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
            const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
            capacities.push(calculateRegexPatternSetsStatementsCapacity(statementRegexPatternSetsStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
          }
          const notStatementStatement = statement.notStatement as wafv2.CfnWebACL.NotStatementProperty | undefined;
          if(notStatementStatement && notStatementStatement.statement) {
            const statement = notStatementStatement.statement as wafv2.CfnWebACL.StatementProperty;
            const notstatementIpSetReferenceStatement = statement.ipSetReferenceStatement as wafv2.CfnWebACL.IPSetReferenceStatementProperty | undefined;
            if(notstatementIpSetReferenceStatement && !notstatementIpSetReferenceStatement.arn.startsWith("arn:aws:")) {
              const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
              capacities.push(calculateIpsSetStatementCapacity(notstatementIpSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
            }
            const notstatementRegexPatternSetsStatement = statement.regexPatternSetReferenceStatement as wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty | undefined;
            if(notstatementRegexPatternSetsStatement && notstatementRegexPatternSetsStatement.arn.startsWith("arn:aws:")) {
              const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
              capacities.push(calculateRegexPatternSetsStatementsCapacity(notstatementRegexPatternSetsStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
            }
          }
        }
        else if(ipSetReferenceStatement && !ipSetReferenceStatement.arn.startsWith("arn:aws:")) {
          const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
          capacities.push(calculateIpsSetStatementCapacity(ipSetReferenceStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
        }
        else if(regexPatternSetsStatement && !regexPatternSetsStatement.arn.startsWith("arn:aws:")) {
          const tempRule = calculateRatebasedStatementwithoutScopeDownStatement(customRule, rateBasedStatement);
          capacities.push(calculateRegexPatternSetsStatementsCapacity(regexPatternSetsStatement) + await calculateCustomRuleStatementsCapacity(config, tempRule, deploymentRegion, scope, runtimeProperties));
        }
      }
    }
    else {
      capacities.push(await calculateCustomRuleStatementsCapacity(config, customRule, deploymentRegion, scope, runtimeProperties));
    }
    capacitieslog.push([customRule.priority, customRule.name,capacities[capacities.length-1], Object.keys(customRule.statement)[0].charAt(0).toUpperCase()+ Object.keys(customRule.statement)[0].slice(1)]);
  }
  capacitieslog.sort((a, b) => parseInt(a[0] as string,10) - parseInt(b[0] as string,10));
  console.log(table(capacitieslog));
  return capacities;
}

/**
   * Function to remove the ScopeDown statement from the RateBasedStatement
   * @param customRule the customRule
   * @param rateBasedStatement the RateBasedStatement
   * @returns tempCalcRule
   */
function calculateRatebasedStatementwithoutScopeDownStatement(customRule: FmsRule, rateBasedStatement: wafv2.CfnWebACL.RateBasedStatementProperty): FmsRule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { scopeDownStatement, ...rateBasedWithoutScopeDown } = rateBasedStatement;
  const statement:wafv2.CfnWebACL.StatementProperty = {
    rateBasedStatement: rateBasedWithoutScopeDown
  };
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
   * Implementation of the calculation of the capacity for IPSet statements according to https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-ipset-match.html
   * @param ipSetReferenceStatement the IPSetReferenceStatement
   * @returns the capacity of the IPSet statement
   */
function calculateIpsSetStatementCapacity(ipSetReferenceStatement: wafv2.CfnWebACL.IPSetReferenceStatementProperty) {
  let ipSetRuleCapacity = 1;
  const ipSetForwardedIpConfig = ipSetReferenceStatement.ipSetForwardedIpConfig as wafv2.CfnWebACL.IPSetForwardedIPConfigurationProperty | undefined;
  if(ipSetForwardedIpConfig && ipSetForwardedIpConfig.position === "ANY") ipSetRuleCapacity += 4;
  return ipSetRuleCapacity;
}

/**
 * Calculate Custom Rule Statements Capacity
 * @param config Config
 * @param customRule FmsRule
 * @param deploymentRegion string
 * @param scope "REGIONAL" | "CLOUDFRONT"
 * @returns 
 */
async function calculateCustomRuleStatementsCapacity(config: wafConfig, customRule: FmsRule, deploymentRegion: string, scope: "REGIONAL" | "CLOUDFRONT", runtimeProperties: RuntimeProperties) {
  const ruleCalculatedCapacityJson = [];
  const rule = transformCdkRuletoSdkRule(customRule, runtimeProperties);
  ruleCalculatedCapacityJson.push(rule);
  const capacity = await getTotalCapacityOfRules(
    config,
    runtimeProperties,
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
function calculateRegexPatternSetsStatementsCapacity(regexPatternSetsStatement: wafv2.CfnWebACL.RegexPatternSetReferenceStatementProperty) {
  let regexRuleCapacity = 0;
  const regexRulebaseCost = 25;
  const regexPatterSetsFieldToMatch = regexPatternSetsStatement.fieldToMatch as wafv2.CfnWebACL.FieldToMatchProperty | undefined;
  if(regexPatterSetsFieldToMatch && regexPatterSetsFieldToMatch.allQueryArguments){
    regexRuleCapacity += 10;
  }
  if(regexPatterSetsFieldToMatch && regexPatterSetsFieldToMatch.jsonBody) regexRuleCapacity += (regexRulebaseCost*2);
  regexRuleCapacity += regexRulebaseCost;
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

/**
 * Buld Custom Rule without reference statements
 * @param customRule FmsRule
 * @param concatenatedStatement wafv2.CfnWebACL.AndStatementProperty | wafv2.CfnWebACL.OrStatementProperty
 * @param isOrStatement boolean
 * @returns tempCalcRule
 */
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
export async function isWcuQuotaReached(deploymentRegion: string, runtimeProps: RuntimeProperties, config: wafConfig): Promise<boolean> {
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
  if(runtimeProps.PostProcess.IpReputationListCount === 0 && runtimeProps.PreProcess.IpReputationListCount === 0){
    guidanceHelper.getGuidance("noIpReputationList", runtimeProps);
  }
  return wcuLimitReached;
}