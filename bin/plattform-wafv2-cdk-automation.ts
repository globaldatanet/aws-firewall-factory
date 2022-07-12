#!/usr/bin/env node
import { PlattformWafv2CdkAutomationStack } from "../lib/plattform-wafv2-cdk-automation-stack";
import * as cdk from "aws-cdk-lib";
import { realpathSync, existsSync } from "fs";
import { validate } from "../lib/tools/config-validator";
import { Config, PriceRegions, RegionString } from "../lib/types/config";
import { isPolicyQuotaReached, isWcuQuotaReached, setOutputsFromStack, initRuntimeProperties } from "../lib/tools/helpers";
import {isPriceCalculated, GetCurrentPrices} from "../lib/tools/price-calculator";
import * as packageJsonObject from "../package.json";


/**
 * Version of the AWS Firewall Factory - extracted from package.json
 */
const FIREWALL_FACTORY_VERSION = packageJsonObject.version;

/**
 * relative path to config file imported from the env PROCESS_PARAMETERS
 */
const configFile = process.env.PROCESS_PARAMETERS;

/**
 * the region into which the stack is deployed
 */
let deploymentRegion = "";

if (configFile && existsSync(configFile)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Config = require(realpathSync(configFile));
  if (validate(config)){
    if(config.WebAcl.Scope === "CLOUDFRONT"){
      deploymentRegion = "us-east-1";
    }
    else{
      deploymentRegion = process.env.REGION || "eu-central-1";
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
    console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
    console.log("👤 AWS Profile used: ","\x1b[33m","\n                      " + process.env.AWSUME_PROFILE,"\x1b[0m");
    console.log("🌎 CDK deployment region:","\x1b[33m","\n                      "+deploymentRegion,"\x1b[0m \n");
    (async () => {
      const isNewStack = (config.General.DeployHash === "");
      const runtimeProperties = initRuntimeProperties();
      if(isNewStack){
        console.log("ℹ First Deployment of this WAF.");
        const tempHash = Date.now().toString(36);
        config.General.DeployHash = tempHash;
        console.log("#️⃣  Generated Deployment Hash for this WAF: "+  config.General.DeployHash);
        if (process.env.SKIP_QUOTA_CHECK === "true") {
          console.log("❗️ SKIPPING Quota Check for Policies.");
        } else {
          const policyQuotaReached = await isPolicyQuotaReached(deploymentRegion);
          if (policyQuotaReached) {
            console.error("\u001B[31m","🚨 Exit process due Quota Check for Policies 🚨 \n\n","\x1b[0m" + "\n\n");
            process.exit(1);
          }
        }
      }
      else{
        await setOutputsFromStack(deploymentRegion, runtimeProperties, config);
        console.log("#️⃣  Deployment Hash for this WAF: "+  config.General.DeployHash);
      }
      console.log("🔥 Deploy FMS Policy: " + config.General.Prefix.toUpperCase() + "-" + config.WebAcl.Name.toUpperCase()+ "-" + config.General.Stage + "-" + config.General.DeployHash + "\n ⦂ Type: " +config.WebAcl.Type + "\n📚 Stackname: ","\u001b[32m",config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(),"\u001b[0m");
      const wcuQuotaReached = await isWcuQuotaReached(deploymentRegion, runtimeProperties, config);
      if(wcuQuotaReached) {
        console.error("\u001B[31m","🚨 Exit process due Quota Check for WCU 🚨 \n\n","\x1b[0m" + "\n\n");
        process.exit(1);
      }
      const app = new cdk.App();
      new PlattformWafv2CdkAutomationStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(), {
        config, runtimeProperties: runtimeProperties,
        env: {
          region: deploymentRegion,
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
      });
      const Prices = await GetCurrentPrices(PriceRegions[deploymentRegion as RegionString], runtimeProperties);
      const PriceCalculated = await isPriceCalculated(runtimeProperties);
    })();
  } else {
    console.log(`
    █████╗ ██╗    ██╗███████╗    ███████╗██╗██████╗ ███████╗██╗    ██╗ █████╗ ██╗     ██╗         ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
   ██╔══██╗██║    ██║██╔════╝    ██╔════╝██║██╔══██╗██╔════╝██║    ██║██╔══██╗██║     ██║         ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
   ███████║██║ █╗ ██║███████╗    █████╗  ██║██████╔╝█████╗  ██║ █╗ ██║███████║██║     ██║         █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝
   ██╔══██║██║███╗██║╚════██║    ██╔══╝  ██║██╔══██╗██╔══╝  ██║███╗██║██╔══██║██║     ██║         ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝
   ██║  ██║╚███╔███╔╝███████║    ██║     ██║██║  ██║███████╗╚███╔███╔╝██║  ██║███████╗███████╗    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║
   ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝
   `);
    console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
    console.log("\n 🧪 Validation of your ConfigFile: \n   📂 " + configFile + "\n\n");
    console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validate.errors, null, 2)+ "\n\n");
    process.exit(1);
  }
}
else {
  console.log("File", configFile, "not found. - NO CDK ERROR");
}

