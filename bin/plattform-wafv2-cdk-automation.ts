#!/usr/bin/env node
import { PlattformWafv2CdkAutomationStack } from "../lib/plattform-wafv2-cdk-automation-stack";
import * as cdk from "aws-cdk-lib";
import * as fs from "fs";
import { WAFV2Client, CheckCapacityCommandOutput, CheckCapacityCommand, CheckCapacityCommandInput, DescribeManagedRuleGroupCommand, DescribeManagedRuleGroupCommandInput } from "@aws-sdk/client-wafv2";
import * as quota from "@aws-sdk/client-service-quotas";
import * as cloudformation from "@aws-sdk/client-cloudformation"
import { FMSClient, ListPoliciesCommand, ListPoliciesCommandInput } from "@aws-sdk/client-fms";
import { exit, off, prependOnceListener } from "process";
import * as template from "../values/calculatecapacity.json";
import { print } from "util";
import * as lodash from "lodash";
import { validate } from "../lib/tools/config-validator";
import {Config} from "../lib/types/config";
import { Runtimeprops } from "../lib/types/runtimeprops";
import * as awsfirewallfactoryinfo from "../package.json";
const afwfver = awsfirewallfactoryinfo.version
const runtimeprops: Runtimeprops = {PreProcessCapacity: 0, PostProcessCapacity: 0, 
  PreProcessDeployedRuleGroupCapacities: [], PreProcessRuleCapacities: [],  PreProcessDeployedRuleGroupNames: [], PreProcessDeployedRuleGroupIdentifier: [],
  PostProcessDeployedRuleGroupCapacities: [], PostProcessRuleCapacities: [],  PostProcessDeployedRuleGroupNames: [], PostProcessDeployedRuleGroupIdentifier: []
}

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
  const response: any = await client.send(command);
  return response.Capacity | 0
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
            console.log("ℹ️  There is an open Quota request for " + Quoata + " but it is still not approved using DEFAULT Quota.")
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
    const response: any = await client.send(command);
    return response.Capacity | 0
  }
  else{
    const input: DescribeManagedRuleGroupCommandInput = {
      VendorName: Vendor,
      Name: Name,
      Scope: Scope,
      VersionName: Version
    }
    const command = new DescribeManagedRuleGroupCommand(input);
    const response: any = await client.send(command);
    return response.Capacity | 0
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
        runtimeprops.PreProcessDeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "DeployedRuleGroupIdentifier")
      {
        runtimeprops.PreProcessDeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "DeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        runtimeprops.PreProcessDeployedRuleGroupCapacities = arrayOfNumbers
      }
      if(output.OutputKey == "PreProcessDeployedRuleGroupNames")
      {
        runtimeprops.PreProcessDeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "PreProcessDeployedRuleGroupIdentifier")
      {
        runtimeprops.PreProcessDeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "PreProcessDeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        runtimeprops.PreProcessDeployedRuleGroupCapacities = arrayOfNumbers
      }
      if(output.OutputKey == "PostProcessDeployedRuleGroupNames")
      {
        runtimeprops.PostProcessDeployedRuleGroupNames = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "PostProcessDeployedRuleGroupIdentifier")
      {
        runtimeprops.PostProcessDeployedRuleGroupIdentifier = output.OutputValue?.split(",",output.OutputValue?.length) || []
      }
      else if(output.OutputKey == "PostProcessDeployedRuleGroupCapacities")
      {
        const arrayOfNumbers = output.OutputValue?.split(",",output.OutputValue?.length).map(Number)  || [];
        runtimeprops.PostProcessDeployedRuleGroupCapacities = arrayOfNumbers
      }
    }
  }
}

// Export to Outputs Capacity Names etc.
let deploymentregion = ""
const configFile = process.env.PROCESS_PARAMETERS;
if (configFile && fs.existsSync(configFile)) {
  const config: Config = require(fs.realpathSync(configFile));
  if (validate(config)){
    const app = new cdk.App();
    runtimeprops.PostProcessRuleCapacities = []
    runtimeprops.PreProcessRuleCapacities = []
    let Temp_Hash
    if(config.WebAcl.Scope == "CLOUDFRONT"){
      deploymentregion = "us-east-1"
    }
    else{
      deploymentregion = process.env.REGION || "eu-central-1"
    }
    console.log(`
   █████╗ ██╗    ██╗███████╗    ███████╗██╗██████╗ ███████╗██╗    ██╗ █████╗ ██╗     ██╗         ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
  ██╔══██╗██║    ██║██╔════╝    ██╔════╝██║██╔══██╗██╔════╝██║    ██║██╔══██╗██║     ██║         ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
  ███████║██║ █╗ ██║███████╗    █████╗  ██║██████╔╝█████╗  ██║ █╗ ██║███████║██║     ██║         █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ 
  ██╔══██║██║███╗██║╚════██║    ██╔══╝  ██║██╔══██╗██╔══╝  ██║███╗██║██╔══██║██║     ██║         ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  
  ██║  ██║╚███╔███╔╝███████║    ██║     ██║██║  ██║███████╗╚███╔███╔╝██║  ██║███████╗███████╗    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   
  ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
  `);
    console.log("\x1b[36m","\n                                                                                                                                        by globaldatanet","\x1b[0m");
    console.log("\n🏷  Version: ","\x1b[4m",afwfver,"\x1b[0m")
    console.log("👤 AWS Profile used: ","\x1b[33m","\n                      " + process.env.AWSUME_PROFILE,"\x1b[0m");
    console.log("🌎 CDK deployment region:","\x1b[33m","\n                      "+deploymentregion,"\x1b[0m \n")
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
        if(process.env.SKIP_QUOTA_CHECK == "true"){
          console.log("❗️ SKIPPING Quota Check for Quota: L-0B28E140")
        }
        else{
          const quota_policies = await CheckQuota("L-0B28E140");
          if(quota_policies <= policies){
            console.log("\n🚨 You are about to exceed the limit for Policies per region.\n Region Quota: " +quota_policies + "\n Deployed Policies: " + policies + "\n ﹗ Stopping deployment ﹗")
            exitCode = 1;
          }
        }
        console.log("ℹ First Deployment of this WAF.")
      }else{
        await GetOutputsFromStack(StackName, config);
      }
      let count = 0
      let pre_calculate_capacity_sum = 0
      if(config.WebAcl.PreProcess.CustomRules === undefined){
        console.log("\n ℹ️  Skip Rule Capacity Calculation for PreProcess Custom Rules.")}
      else{
        while (count < config.WebAcl.PreProcess.CustomRules.length) {
          if("Captcha" in config.WebAcl.PreProcess.CustomRules[count].Action){
            const rule_calculated_capacity_json = [];
            const temp_template = template;
            temp_template.Statement = config.WebAcl.PreProcess.CustomRules[count].Statement;
            temp_template.Action = config.WebAcl.PreProcess.CustomRules[count].Action;
            temp_template.CaptchaConfig = config.WebAcl.PreProcess.CustomRules[count].CaptchaConfig;
            rule_calculated_capacity_json.push(temp_template);
            const capacity = await CheckCapacity(config.WebAcl.Scope, rule_calculated_capacity_json);
            runtimeprops.PreProcessRuleCapacities.push(capacity);
          }
          else{
            const rule_calculated_capacity_json = [];
            const temp_template = template;
            temp_template.Statement = config.WebAcl.PreProcess.CustomRules[count].Statement;
            temp_template.Action = config.WebAcl.PreProcess.CustomRules[count].Action;
            delete temp_template.CaptchaConfig
            rule_calculated_capacity_json.push(temp_template);
            const capacity = await CheckCapacity(config.WebAcl.Scope, rule_calculated_capacity_json);
            runtimeprops.PreProcessRuleCapacities.push(capacity);
          }
          count++
        }
        pre_calculate_capacity_sum = runtimeprops.PreProcessRuleCapacities.reduce(function (a, b) {
          return a + b;
        }, 0);
      }
      count = 0
      let post_calculate_capacity_sum = 0
      if(config.WebAcl.PostProcess.CustomRules === undefined){
        console.log("\n ℹ️  Skip Rule Capacity Calculation for PostProcess Custom Rules.")
      }
      else{
        while (count < config.WebAcl.PostProcess.CustomRules.length) {
          const rule_calculated_capacity_json = [];
          const temp_template = template;
          if("Captcha" in config.WebAcl.PostProcess.CustomRules[count].Action){
            temp_template.CaptchaConfig = config.WebAcl.PostProcess.CustomRules[count].CaptchaConfig;
          }
          else{
            delete temp_template.CaptchaConfig
          }
          if(config.WebAcl.PostProcess.CustomRules[count].RuleLabels){
            temp_template.RuleLabels = config.WebAcl.PostProcess.CustomRules[count].RuleLabels;
          }
          else{
            delete temp_template.RuleLabels
          }
          temp_template.Statement = config.WebAcl.PostProcess.CustomRules[count].Statement;
          temp_template.Action = config.WebAcl.PostProcess.CustomRules[count].Action;
          rule_calculated_capacity_json.push(temp_template);
          const capacity = await CheckCapacity(config.WebAcl.Scope, rule_calculated_capacity_json);
          runtimeprops.PostProcessRuleCapacities.push(capacity);
          count++
        }
        post_calculate_capacity_sum = runtimeprops.PostProcessRuleCapacities.reduce(function (a, b) {
          return a + b;
        }, 0);
      }
      let managedrule;
      let managedrulecapacity = 0;
      console.log("\n👀 Get ManagedRule Capacity:\n")
      if(config.WebAcl.PreProcess.ManagedRuleGroups === undefined){
        console.log("\n ℹ️  No ManagedRuleGroups defined in PreProcess.")
      }
      else{
        console.log(" 🥇 PreProcess: ")
        for(managedrule of config.WebAcl.PreProcess.ManagedRuleGroups){
          const capacity = await GetManagedRuleCapacity(managedrule.Vendor,managedrule.Name,config.WebAcl.Scope,managedrule.Version)
          managedrule.Capacity = capacity
          console.log("   ➕ Capacity for " + managedrule.Name + " is [" + managedrule.Capacity + "]")
          managedrulecapacity = managedrulecapacity + capacity
        }
      }
      if(config.WebAcl.PostProcess.ManagedRuleGroups === undefined){
        console.log("\n ℹ️  No ManagedRuleGroups defined in PostProcess.")
      }
      else{
        console.log("\n 🥈 PostProcess: ")
        for(managedrule of config.WebAcl.PostProcess.ManagedRuleGroups){
          const capacity = await GetManagedRuleCapacity(managedrule.Vendor,managedrule.Name,config.WebAcl.Scope,managedrule.Version)
          managedrule.Capacity = capacity
          console.log("   ➕ Capacity for " + managedrule.Name + " is [" + managedrule.Capacity + "]")
          managedrulecapacity = managedrulecapacity + capacity
        }
      }
      runtimeprops.PreProcessCapacity = pre_calculate_capacity_sum
      runtimeprops.PostProcessCapacity = post_calculate_capacity_sum
      const custom_capacity = runtimeprops.PreProcessCapacity + runtimeprops.PostProcessCapacity
      const total_wcu = runtimeprops.PreProcessCapacity + runtimeprops.PostProcessCapacity + managedrulecapacity
      const quote_wcu = await CheckQuota("L-D86ED2F3");
      if (total_wcu <= Number(quote_wcu)) {
        console.log("\n🔎 Capacity Check result: 🟢 \n")
        console.log(" 💡 Account WAF-WCU Quota: " +Number(quote_wcu).toString())
        console.log(" 🧮 Calculated Custom Rule Capacity is: [" + custom_capacity + "] (🥇[" + runtimeprops.PreProcessCapacity + "] + 🥈[" + runtimeprops.PostProcessCapacity + "]) \n ➕ ManagedRulesCapacity: ["+ managedrulecapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n")
      }
      else {
        console.log("\n🔎 Capacity Check result: 🔴 \n  ﹗ Stopping deployment ﹗\n")
        console.log(" 💡 Account WAF-WCU Quota: " +Number(quote_wcu).toString())
        console.log(" 🧮 Calculated Custom Rule Capacity is: [" + custom_capacity + "] \n ➕ ManagedRulesCapacity: ["+ managedrulecapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n")
        exitCode = 1;
      }
      if(exitCode == 1){
        process.exitCode = 1;
      }
      new PlattformWafv2CdkAutomationStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(), {
        config, runtimeprops,
        env: {
          region: deploymentregion,
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
      });
    //app.synth()
    })();
  // }
  }else {
    console.log(`
    █████╗ ██╗    ██╗███████╗    ███████╗██╗██████╗ ███████╗██╗    ██╗ █████╗ ██╗     ██╗         ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
   ██╔══██╗██║    ██║██╔════╝    ██╔════╝██║██╔══██╗██╔════╝██║    ██║██╔══██╗██║     ██║         ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
   ███████║██║ █╗ ██║███████╗    █████╗  ██║██████╔╝█████╗  ██║ █╗ ██║███████║██║     ██║         █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ 
   ██╔══██║██║███╗██║╚════██║    ██╔══╝  ██║██╔══██╗██╔══╝  ██║███╗██║██╔══██║██║     ██║         ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  
   ██║  ██║╚███╔███╔╝███████║    ██║     ██║██║  ██║███████╗╚███╔███╔╝██║  ██║███████╗███████╗    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   
   ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
   `);
    console.log("\n🏷  Version: ","\x1b[4m",afwfver,"\x1b[0m")
    console.log("\n 🧪 Validation of your ConfigFile: \n   📂 " + configFile + "\n\n")
    console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validate.errors, null, 2)+ "\n\n");
    process.exitCode = 1;
  }
}
else {
  console.log("File", configFile, "not found. - NO CDK ERROR");
}
function elseif() {
  throw new Error("Function not implemented.");
}

