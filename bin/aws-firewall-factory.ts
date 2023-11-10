#!/usr/bin/env node
import { WafStack } from "../lib/web-application-firewall-stack";
import { NetworkfirewallStack } from "../lib/network-firewall";
import { PrerequisitesStack } from "../lib/prerequisites-stack";
import * as cdk from "aws-cdk-lib";
import { wrongLoggingConfiguration } from "../lib/tools/config-validator";
import { Config, Prerequisites, PriceRegions, RegionString } from "../lib/types/config";
import { isPolicyQuotaReached, isWcuQuotaReached, setOutputsFromStack, initRuntimeProperties, outputInfoBanner } from "../lib/tools/helpers";
import {isPriceCalculated, getCurrentPrices} from "../lib/tools/price-calculator";
import * as values from "../values";

/**
 * relative path to config file imported from the env PROCESS_PARAMETERS
 */
const CONFIG_OBJECT_NAME = process.env.PROCESS_PARAMETERS;

if(!CONFIG_OBJECT_NAME || (values.configs[CONFIG_OBJECT_NAME] === undefined && values.prereq[CONFIG_OBJECT_NAME] === undefined)) {
  console.log("Configuration ", CONFIG_OBJECT_NAME, " not found.");
  process.exit(1);
}

const app = new cdk.App();

void (async () => {
  // ---------------------------------------------------------------------
  // Deploying prerequisite stack
  console.log(process.env.PREREQUISITE);
  if(process.env.PREREQUISITE === "true") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    const prerequisites: Prerequisites = values.prereq[CONFIG_OBJECT_NAME];
    outputInfoBanner();

    console.log("ℹ️   Deploying Prerequisites Stack.");
    const app = new cdk.App();
    new PrerequisitesStack(app, prerequisites.General.Prefix.toUpperCase() + "-AWS-FIREWALL-FACTORY-PREQUISITES", {
      prerequisites,
      env: {
        region: process.env.AWS_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Deploying Firewall stack

  else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config: Config = values.configs[CONFIG_OBJECT_NAME];
    const deploymentRegion= outputInfoBanner(config);
    const runtimeProperties = initRuntimeProperties();
    if(config.WebAcl){
      if (process.env.SKIP_QUOTA_CHECK === "true") {
        console.log("❗️ SKIPPING Quota Check for Policies.❗️\n\n");
      } else {
        const policyQuotaReached = await isPolicyQuotaReached(deploymentRegion);
        if (policyQuotaReached) {
          console.error("\u001B[31m","🚨 ERROR: Exit process due Quota Check for Policies 🚨 \n\n","\x1b[0m" + "\n\n");
          process.exit(1);
        }
      }
      await setOutputsFromStack(deploymentRegion, runtimeProperties, config);
      if(config.General.DeployHash){
        console.log("#️⃣  Deployment Hash for this WAF: "+  config.General.DeployHash);
        console.log("   ⚠️   Legacy functionality ⌛️\n\n");
      }
      console.log(`🔥 Deploy WAF Policy: ${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}\n ⦂ Type:
      ${config.WebAcl.Type}\n📚 Stackname:`);
      console.log("\u001b[32m",`   ${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}`,"\u001b[0m");
      console.log("\n 🎯 Targets:");
      if(config.WebAcl.IncludeMap.account){
        for (const account of config.WebAcl.IncludeMap.account) {
          console.log("\x1b[32m", `   🛬 ${account}`, "\x1b[0m");
        }
      }
      if(config.WebAcl.IncludeMap.orgunit){
        for (const unit of config.WebAcl.IncludeMap.orgunit) {
          console.log("\x1b[32m", `   🛬 ${unit}`, "\x1b[0m");
        }
      }
      console.log("\n 📑 Logging:");
      if(config.General.LoggingConfiguration ==="Firehose"){
        console.log("   🧯  " + config.General.LoggingConfiguration);
        console.log("      ⚙️  [" + config.General.S3LoggingBucketName +"]");
      }
      if(config.General.LoggingConfiguration ==="S3"){
        console.log("   🪣  " + config.General.LoggingConfiguration);
        console.log("      ⚙️  [" + config.General.S3LoggingBucketName +"]");
      }
      if(Array.isArray(config.WebAcl.IPSets) &&  config.WebAcl.IPSets.length > 0) {
        console.log("\n𝍂 IPSets");
        for(const ipSet of config.WebAcl.IPSets) {
          console.log("   ➕ " + ipSet.name);
          console.log("      ⚙️  [" + ipSet.ipAddressVersion + "] | 🌎 [" + config.WebAcl.Scope+ "]");
        }
      }
      if(Array.isArray(config.WebAcl.RegexPatternSets) &&  config.WebAcl.RegexPatternSets.length > 0) {
        console.log("\n𝍂 RegexPatternSets");
        for(const regpatternset of config.WebAcl.RegexPatternSets) {
          console.log("   ➕ " + regpatternset.name);
          console.log("      ⚙️ 🌎 [" + config.WebAcl.Scope+ "]");
        }
      }
      const wcuQuotaReached = await isWcuQuotaReached(deploymentRegion, runtimeProperties, config);
      if(wcuQuotaReached) {
        console.error("\u001B[31m","🚨 ERROR: Exit process due Quota Check for WCU 🚨 \n\n","\x1b[0m" + "\n\n");
        process.exit(1);
      }
      if(wrongLoggingConfiguration(config)){
        console.error("\u001B[31m"," 🚨 ERROR: Amazon S3 bucket name is invalid 🚨 ", "\x1b[0m" +"\n     🪣 Amazon S3 bucket name must begin with \"aws-waf-logs-\" followed by at least one \n     of the following characters [a-z0-9_.-]\n\n","\x1b[0m" + "\n\n");
        process.exit(1);
      }
      new WafStack(app, `${config.General.Prefix.toUpperCase()}-WAF-${config.WebAcl.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}`, {
        config, runtimeProperties: runtimeProperties,
        env: {
          region: deploymentRegion,
          account: process.env.CDK_DEFAULT_ACCOUNT
        },
      });
      await getCurrentPrices(PriceRegions[deploymentRegion as RegionString], runtimeProperties, config,deploymentRegion);
      await isPriceCalculated(runtimeProperties);
    }
    if(config.NetworkFirewall){
      console.log(`🔥 Deploy Network Policy: ${config.General.Prefix.toUpperCase()}-NFW-${config.NetworkFirewall.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}\n`);
      console.log("\u001b[32m",`   ${config.General.Prefix.toUpperCase()}-NFW-${config.NetworkFirewall.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}`,"\u001b[0m");
      // new NetworkfirewallStack(app, `${config.General.Prefix.toUpperCase()}-NFW-${config.NetworkFirewall.Name.toUpperCase()}-${config.General.Stage.toUpperCase()}${config.General.DeployHash ? "-"+config.General.DeployHash.toUpperCase() : ""}`, {
      //   config, runtimeProperties: runtimeProperties,
      //   env: {
      //     region: deploymentRegion,
      //     account: process.env.CDK_DEFAULT_ACCOUNT
      //   },
      // });
    }
  }
})();