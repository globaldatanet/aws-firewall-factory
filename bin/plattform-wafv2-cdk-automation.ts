#!/usr/bin/env node
import { PlattformWafv2CdkAutomationStack, Config } from "../lib/plattform-wafv2-cdk-automation-stack";
import * as cdk from "@aws-cdk/core";
import * as fs from "fs";
import { WAFV2Client, CheckCapacityCommand, CheckCapacityCommandInput, Statement, DescribeManagedRuleGroupCommand, DescribeManagedRuleGroupCommandInput } from "@aws-sdk/client-wafv2";
import * as quota from "@aws-sdk/client-service-quotas";
import { exit, prependOnceListener } from "process";
import * as template from "../values/calculatecapacity.json";
import { print } from "util";

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


async function CheckCapacity(Scope: string, calculated_capacity_json: object): Promise<number> {
  const client = new WAFV2Client({ region: process.env.CDK_DEFAULT_REGION });
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
  const quoata_client = new quota.ServiceQuotasClient({ region: process.env.CDK_DEFAULT_REGION });
  const input: quota.GetAWSDefaultServiceQuotaCommandInput = {
    QuotaCode: Quoata,
    ServiceCode: "fms"
  };  
  const command = new quota.GetAWSDefaultServiceQuotaCommand(input);
  const responsequoata = await quoata_client.send(command);
  return responsequoata.Quota?.Value || 0
}

async function GetManagedRuleCapacity(Vendor: string, Name: string, Scope: string, Version: string): Promise<number>{
  const client = new WAFV2Client({ region: process.env.CDK_DEFAULT_REGION });
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

const configFile = process.env.PROCESS_PARAMETERS;
if (configFile && fs.existsSync(configFile)) {
  const config: Config = require(fs.realpathSync(configFile));
  const app = new cdk.App();
  config.RuleCapacities = []
  console.log("🔥 Deploy FMS Policy: " + config.General.Prefix.toUpperCase() + "-" + config.WebAcl.Name.toUpperCase()+ "-" + config.General.Stage + "\n ⦂ Type: " +config.WebAcl.Type + "\n📚 Stackname: " + config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase())
  if (config.WebAcl.RuleStatements == "DEFAULT") {
    config.RuleCapacities = []
    console.log("ℹ️ Skip Rule Capacity Calculation.")
  }
  else {
    (async () => {

      let count = 0
      while (count < config.WebAcl.RuleStatements.length) {
        const rule_calculated_capacity_json = [];
        const temp_template = template;
        temp_template.Statement = config.WebAcl.RuleStatements[count];
        rule_calculated_capacity_json.push(temp_template);
        const capacity = await CheckCapacity(config.WebAcl.Scope, rule_calculated_capacity_json);

        config.RuleCapacities.push(capacity);
        count++
      }
      const calculate_capacity_sum = config.RuleCapacities.reduce(function (a, b) {
        return a + b;
      }, 0);
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
      const quota = await CheckQuota("L-D86ED2F3");
      if (total_wcu <= Number(quota)) {
        console.log("\n🔎 Capacity Check result: 🟢 \n")
        console.log(" 💡 Account WAF-WCU Quota: " +Number(quota).toString())
        console.log(" 🧮 Calculated Custom Rule Capacity is: [" + config.Capacity + "] \n ➕ ManagedRulesCapacity: ["+ managedrulecapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n")
      }
      else {
        console.log("\n🔎 Capacity Check result: 🔴 \n")
        console.log(" 💡 Account WAF-WCU Quota: " +Number(quota).toString())
        console.log(" 🧮 Calculated Custom Rule Capacity is: [" + config.Capacity + "] \n ➕ ManagedRulesCapacity: ["+ managedrulecapacity +"] \n ＝ Total Waf Capacity: " + total_wcu.toString() + "\n")
      }

      new PlattformWafv2CdkAutomationStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() , {
        config,
        env: {
          region: process.env.CDK_DEFAULT_REGION,
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
      });

      console.log("\n🌎 Set CDK Default Region to: " + process.env.CDK_DEFAULT_REGION + " \n📦 Set CDK Default Account to: " + process.env.CDK_DEFAULT_ACCOUNT + "\n")
      app.synth()
    })();
  }
}
else {
  console.log("File", configFile, "not found. - NO CDK ERROR");
}
