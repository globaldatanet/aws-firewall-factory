#!/usr/bin/env node
import { PlattformWafv2CdkAutomationStack, Config } from "../lib/plattform-wafv2-cdk-automation-stack";
import * as cdk from "@aws-cdk/core";
import * as fs from "fs";
import { WAFV2Client, CheckCapacityCommand, CheckCapacityCommandInput, Statement,CreateRegexPatternSetCommandInput, CreateRegexPatternSetCommand, DescribeManagedRuleGroupCommand, DescribeManagedRuleGroupCommandInput, CreateRegexPatternSetRequest, RegexPatternSet } from "@aws-sdk/client-wafv2";
import * as quota from "@aws-sdk/client-service-quotas";
import * as cloudformation from "@aws-sdk/client-cloudformation"
import { FMSClient, ListPoliciesCommand, ListPoliciesCommandInput } from "@aws-sdk/client-fms";
import { exit, off, prependOnceListener } from "process";
import * as template from "../values/calculatecapacity.json";
import { print } from "util";
import { AnyPrincipal } from "@aws-cdk/aws-iam";
import * as lodash from "lodash";

function str2ab(str: string): Uint8Array {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

function convertRules(o: any) {
  var newO: any, origKey: any, value: any
  if (o instanceof Array) {
    return o.map(function (value) {
      if (typeof value === "object") {
        value = convertRules(value)
      }
      return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (o.hasOwnProperty(origKey)) {
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = convertRules(value)
        }
        if (origKey == "SearchString") {
          value = str2ab(o[origKey])
        }
        newO[origKey] = value
      }
    }
  }
  return newO
}

async function ListPolicies(): Promise<number> {
  const client = new FMSClient({ region: deploymentregion });
  const input: ListPoliciesCommandInput = {
  };
  const command = new ListPoliciesCommand(input);
  const response = await client.send(command);
  return response.PolicyList?.length || 0
}

async function CheckCapacity(Scope: string, calculated_capacity_json: object): Promise<number> {
  const client = new WAFV2Client({ region: deploymentregion });
  const newRules = convertRules(calculated_capacity_json)
  const input: CheckCapacityCommandInput = {
    Scope: Scope,
    Rules: newRules
  };
  const command = new CheckCapacityCommand(input);
  const response = await client.send(command);
  return response.Capacity || 0
}
async function CheckQuota(Quoata: string): Promise<number>{
  let current_quota = 0
  const quoata_client = new quota.ServiceQuotasClient({ region: deploymentregion });
  const input: quota.GetAWSDefaultServiceQuotaCommandInput = {
    QuotaCode: Quoata,
    ServiceCode: "fms"
  };
  const command = new quota.GetAWSDefaultServiceQuotaCommand(input);
  const responsequoata = await quoata_client.send(command);
  if(responsequoata.Quota?.Adjustable == true){
    const input: quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommandInput = {
      QuotaCode: Quoata,
      ServiceCode: "fms"
    };
    const command = new quota.ListRequestedServiceQuotaChangeHistoryByQuotaCommand(input);
    const newquota = await quoata_client.send(command);
    if(newquota.RequestedQuotas != []){
      if(newquota.RequestedQuotas?.length || 0 == 0){
        const sortquota = lodash.sortBy(newquota.RequestedQuotas,["Created"]);
        if(sortquota?.length == 1){
          if(sortquota?.[0].Status != "APPROVED"){
            console.log("ℹ️  There is an open Quota request for " + Quoata + "but still not approved using DEFAULT Quota.")
            current_quota = responsequoata.Quota?.Value || 0
            return current_quota
          }
          if(sortquota?.[0].Status == "APPROVED"){
            current_quota = sortquota?.[0].DesiredValue  || 0
            return current_quota
          }
        }
      }
      else{
        current_quota = responsequoata.Quota?.Value || 0
        return current_quota
      }
    }
    else{
      current_quota = responsequoata.Quota?.Value || 0
      return current_quota
    }
  }
  current_quota = responsequoata.Quota?.Value || 0
  return current_quota
}

async function GetManagedRuleCapacity(Vendor: string, Name: string, Scope: string, Version: string): Promise<number>{
  const client = new WAFV2Client({ region: deploymentregion });
  if(Version == ""){
    const input: DescribeManagedRuleGroupCommandInput = {
      VendorName: Vendor,
      Name: Name,
      Scope: Scope
    }
    const command = new DescribeManagedRuleGroupCommand(input);
    const response = await client.send(command)
    return response.Capacity || 0
  }
  else{
    const input: DescribeManagedRuleGroupCommandInput = {
      VendorName: Vendor,
      Name: Name,
      Scope: Scope,
      VersionName: Version
    }
    const command = new DescribeManagedRuleGroupCommand(input);
    const response = await client.send(command)
    return response.Capacity || 0
  }
}

async function GetOutputsFromStack(StackName:string,config: Config): Promise<void>{
  const cloudformation_client = new cloudformation.CloudFormationClient({ region: deploymentregion });
  const params ={
    StackName: StackName
  }
  const command = new cloudformation.DescribeStacksCommand(params);
  const responsestack = await cloudformation_client.send(command);
  if(responsestack.Stacks?.[0].StackName !== undefined && responsestack.Stacks?.[0].Outputs !== undefined){
    for(const output of responsestack.Stacks?.[0].Outputs){
      if(output.OutputKey == "DeployedRuleGroupNames")
      {
        config.DeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "DeployedRuleGroupIdentifier")
      {
        config.DeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "DeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        config.DeployedRuleGroupCapacities = arrayOfNumbers

      }
    }
  }
}

// Export to Outputs Capacity Names etc.
let deploymentregion = ""
const configFile = process.env.PROCESS_PARAMETERS;
if (configFile && fs.existsSync(configFile)) {
  const config: Config = require(fs.realpathSync(configFile));
  const app = new cdk.App();
  config.RuleCapacities = []
  let Temp_Hash
  if(config.WebAcl.Scope == "CLOUDFRONT"){
    deploymentregion = "us-east-1"
  }
  else{
    deploymentregion = process.env.REGION || "eu-central-1"
  }
  if(config.General.DeployHash == ""){
    Temp_Hash = Date.now().toString(36)
    config.General.DeployHash = Temp_Hash
    console.log("#️⃣  Generated Deployment Hash for this WAF: "+  config.General.DeployHash)
  }
  else{
    console.log("#️⃣  Deployment Hash for this WAF: "+  config.General.DeployHash)
  }
  console.log("🔥 Deploy FMS Policy: " + config.General.Prefix.toUpperCase() + "-" + config.WebAcl.Name.toUpperCase()+ "-" + config.General.Stage + "-" + config.General.DeployHash + "\n ⦂ Type: " +config.WebAcl.Type + "\n📚 Stackname: " + config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase());
  (async () => {
    let exitCode = 0;
    const StackName = config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase()
    if(Temp_Hash === config.General.DeployHash){
      const policies = await ListPolicies();
      const quota_policies = await CheckQuota("L-0B28E140");
      if(quota_policies <= policies){
        console.log("\n🚨 You are about to exceed the soft limit for Policies per region.\n Region Quota: " +quota_policies + "\n Deployed Policies: " + policies + "\n ﹗ Stopping deployment ﹗")
        exitCode = 1;
      }
      console.log("ℹ First Deployment of this WAF.")
    }else{
      await GetOutputsFromStack(StackName, config);
    }
    let count = 0
    let calculate_capacity_sum = 0
    if(config.WebAcl.Rules === undefined){
      console.log("ℹ️  Skip Rule Capacity Calculation.")
    }
    else{
      while (count < config.WebAcl.Rules.length) {
        const rule_calculated_capacity_json = [];
        const temp_template = template;
        temp_template.Statement = config.WebAcl.Rules[count].Statement;
        temp_template.Action = config.WebAcl.Rules[count].Action;
        rule_calculated_capacity_json.push(temp_template);
        const capacity = await CheckCapacity(config.WebAcl.Scope, rule_calculated_capacity_json);

        config.RuleCapacities.push(capacity);
        count++
      }
      calculate_capacity_sum = config.RuleCapacities.reduce(function (a, b) {
        return a + b;
      }, 0);
    }
    let managedrule;
    let managedrulecapacity = 0;
    console.log("\n👓 Get ManagedRule Capacity:\n")
    for(managedrule of config.WebAcl.ManagedRuleGroups){
      const capacity = await GetManagedRuleCapacity(managedrule.Vendor,managedrule.Name,config.WebAcl.Scope,managedrule.Version)
      managedrule.Capacity = capacity
      console.log(" ➕ Capacity for " + managedrule.Name + " is [" + managedrule.Capacity + "]")
      managedrulecapacity = managedrulecapacity + capacity
    }
    config.Capacity = calculate_capacity_sum
    const total_wcu = config.Capacity + 725
    const quote_wcu = await CheckQuota("L-D86ED2F3");
    if (total_wcu <= Number(quote_wcu)) {
      console.log("\n🔎 Capacity Check result: 🟢 \n")
      console.log(" 💡 Account WAF-WCU Quota: " +Number(quote_wcu).toString())
      console.log(" 🧮 Calculated Custom Rule Capacity is: [" + config.Capacity + "] \n ➕ ManagedRulesCapacity: ["+ managedrulecapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n")
    }
    else {
      console.log("\n🔎 Capacity Check result: 🔴 \n  ﹗ Stopping deployment ﹗\n")
      console.log(" 💡 Account WAF-WCU Quota: " +Number(quote_wcu).toString())
      console.log(" 🧮 Calculated Custom Rule Capacity is: [" + config.Capacity + "] \n ➕ ManagedRulesCapacity: ["+ managedrulecapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n")
      exitCode = 1;
    }
    if(exitCode == 1){
      process.exitCode = 1;
    }
    new PlattformWafv2CdkAutomationStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(), {
      config,
      env: {
        region: deploymentregion,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    console.log("\n🌎 Set CDK Default Region to: " + deploymentregion + " \n📦 Set CDK Default Account to: " + process.env.CDK_DEFAULT_ACCOUNT + "\n")
    //app.synth()
  })();
  // }
}
else {
  console.log("File", configFile, "not found. - NO CDK ERROR");
}
function elseif() {
  throw new Error("Function not implemented.");
}

