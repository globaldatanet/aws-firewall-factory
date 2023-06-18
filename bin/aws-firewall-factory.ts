#!/usr/bin/env node
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FirewallStack } from "../lib/firewall-stack";
import { PrerequisitesStack } from "../lib/prerequisites-stack";
import * as cdk from "aws-cdk-lib";
import { realpathSync, existsSync } from "fs";
import { validatewaf, validateIPSets, validateprerequisites } from "../lib/tools/config-validator";
import { Config, Prerequisites, PriceRegions, RegionString, IPSet } from "../lib/types/config";
import { isPolicyQuotaReached, isWcuQuotaReached, setOutputsFromStack, initRuntimeProperties } from "../lib/tools/helpers";
import {isPriceCalculated, getCurrentPrices} from "../lib/tools/price-calculator";
import * as packageJsonObject from "../package.json";
<<<<<<< HEAD
import { env } from "process";
import { ValidateFunction } from "ajv";
=======

>>>>>>> 2d597da6 (fix: dependencies, single-header cloudformation warning and log bucket encryption bug)

/**
 * Version of the AWS Firewall Factory - extracted from package.json
 */
const FIREWALL_FACTORY_VERSION = packageJsonObject.version;

/**
 * relative path to config file imported from the env PROCESS_PARAMETERS
 */
const CONFIGFILE = process.env.PROCESS_PARAMETERS;

/**
 * the region into which the stack is deployed
 */
let deploymentRegion = "";

<<<<<<< HEAD
const outputBanner = (): void => {
  console.log(`
      █████╗ ██╗    ██╗███████╗    ███████╗██╗██████╗ ███████╗██╗    ██╗ █████╗ ██╗     ██╗         ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
     ██╔══██╗██║    ██║██╔════╝    ██╔════╝██║██╔══██╗██╔════╝██║    ██║██╔══██╗██║     ██║         ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
     ███████║██║ █╗ ██║███████╗    █████╗  ██║██████╔╝█████╗  ██║ █╗ ██║███████║██║     ██║         █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝
     ██╔══██║██║███╗██║╚════██║    ██╔══╝  ██║██╔══██╗██╔══╝  ██║███╗██║██╔══██║██║     ██║         ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝
     ██║  ██║╚███╔███╔╝███████║    ██║     ██║██║  ██║███████╗╚███╔███╔╝██║  ██║███████╗███████╗    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║
     ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝
      `);
};

const logInvalidConfigFileAndExit = (invalidFileType: "ConfigFile" | "IPSet", validationFilePath: string, ajvValidatorFunction: ValidateFunction): void => {
  outputBanner();
  console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
  console.log(`\n 🧪 Validation of your ${invalidFileType}: \n   📂 ` + validationFilePath + "\n\n");
  console.error("\u001B[31m",`🚨 Invalid ${invalidFileType} File 🚨 \n\n`,"\x1b[0m" + JSON.stringify(ajvValidatorFunction.errors, null, 2)+ "\n\n");
  process.exit(1);
};

if(!configFile || !existsSync(configFile)) {
  console.log("Config file ", configFile, " not found. - NO CDK ERROR");
  process.exit(1);
}

(async () => { 
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Config = require(realpathSync(configFile));
  if (!validatewaf(config)) logInvalidConfigFileAndExit("ConfigFile", realpathSync(configFile), validatewaf);

  // ---------------------------------------------------------------------
  // Deploying prerequisite stack

  if(process.env.PREREQUISITE === "true") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const prerequisites: Prerequisites = require(realpathSync(configFile));
    if(!validateprerequisites(prerequisites)) logInvalidConfigFileAndExit("ConfigFile", realpathSync(configFile), validateprerequisites);

    outputBanner();
    console.log("\x1b[36m","\n                                                                                                                                        by globaldatanet","\x1b[0m");
    console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
    console.log("👤 AWS Account used: ","\x1b[33m","\n                      " + process.env.CDK_DEFAULT_ACCOUNT,"\x1b[0m");
    console.log("🌎 CDK deployment region:","\x1b[33m","\n                      "+process.env.AWS_REGION,"\x1b[0m \n");

    console.log("ℹ️   Deploying Prerequisites Stack.");
    const app = new cdk.App();
    new PrerequisitesStack(app, config.General.Prefix.toUpperCase() + "-AWS-FIREWALL-FACTORY-PREQUISITES", {
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
    if(config.WebAcl.Scope === "CLOUDFRONT"){
      deploymentRegion = "us-east-1";
    }
    else{
      deploymentRegion = process.env.REGION || "eu-central-1";
    }

    outputBanner();
    console.log("\x1b[36m","\n                                                                                                                                        by globaldatanet","\x1b[0m");
    console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
    console.log("👤 AWS Account used: ","\x1b[33m","\n                      " + process.env.CDK_DEFAULT_ACCOUNT,"\x1b[0m");
    console.log("🌎 CDK deployment region:","\x1b[33m","\n                      "+deploymentRegion,"\x1b[0m \n");
    
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
=======
if (CONFIGFILE && existsSync(CONFIGFILE)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Config = require(realpathSync(CONFIGFILE));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prerequisites: Prerequisites = require(realpathSync(CONFIGFILE));
  if(process.env.PREREQUISITE === "true"){
    if(validateprerequisites(prerequisites)){
      // eslint-disable-next-line @typescript-eslint/require-await
      void (async () => {
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
        console.log("👤 AWS Account used: ","\x1b[33m","\n                      " + process.env.CDK_DEFAULT_ACCOUNT,"\x1b[0m");
        console.log("🌎 CDK deployment region:","\x1b[33m","\n                      "+process.env.AWS_REGION,"\x1b[0m \n");

        console.log("ℹ️   Deploying Prequisites Stack.");
        const app = new cdk.App();
        new PrerequisitesStack(app, config.General.Prefix.toUpperCase() + "-AWS-FIREWALL-FACTORY-PREQUISITES", {
          prerequisites,
          env: {
            region: process.env.AWS_REGION,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
        });
      })();}
    else {
      console.log(`
      █████╗ ██╗    ██╗███████╗    ███████╗██╗██████╗ ███████╗██╗    ██╗ █████╗ ██╗     ██╗         ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗
     ██╔══██╗██║    ██║██╔════╝    ██╔════╝██║██╔══██╗██╔════╝██║    ██║██╔══██╗██║     ██║         ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝
     ███████║██║ █╗ ██║███████╗    █████╗  ██║██████╔╝█████╗  ██║ █╗ ██║███████║██║     ██║         █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝
     ██╔══██║██║███╗██║╚════██║    ██╔══╝  ██║██╔══██╗██╔══╝  ██║███╗██║██╔══██║██║     ██║         ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝
     ██║  ██║╚███╔███╔╝███████║    ██║     ██║██║  ██║███████╗╚███╔███╔╝██║  ██║███████╗███████╗    ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║
     ╚═╝  ╚═╝ ╚══╝╚══╝ ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝
     `);
      console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
      console.log("\n 🧪 Validation of your ConfigFile: \n   📂 " + CONFIGFILE + "\n\n");
      console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validateprerequisites.errors, null, 2)+ "\n\n");
      process.exit(1);
    }
  }
  else{
    if (validatewaf(config)){
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
      console.log("👤 AWS Account used: ","\x1b[33m","\n                      " + process.env.CDK_DEFAULT_ACCOUNT,"\x1b[0m");
      console.log("🌎 CDK deployment region:","\x1b[33m","\n                      "+deploymentRegion,"\x1b[0m \n");
      void (async () => {
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
>>>>>>> 09328a24 (adjust linting)
          process.exit(1);
        }
<<<<<<< HEAD
      }
    }
    else{
      await setOutputsFromStack(deploymentRegion, runtimeProperties, config);
      console.log("#️⃣  Deployment Hash for this WAF: "+  config.General.DeployHash);
    }

    console.log("🔥 Deploy FMS Policy: " + config.General.Prefix.toUpperCase() + "-" + config.WebAcl.Name.toUpperCase()+ "-" + config.General.Stage + "-" + config.General.DeployHash + "\n ⦂ Type: " +config.WebAcl.Type + "\n📚 Stackname: ","\u001b[32m",config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(),"\u001b[0m");

    if(Array.isArray(config.WebAcl.IPSets) &&  config.WebAcl.IPSets.length > 0) {
      console.log("\n𝍂 IPSets");
      for(const IpSet of config.WebAcl.IPSets) {
        console.log("   ➕ " + IpSet.Name);
        console.log("      ⚙️  [" + IpSet.IPAddressVersion + "] | 🌎 [" + config.WebAcl.Scope+ "]");
      }
    }
    const wcuQuotaReached = await isWcuQuotaReached(deploymentRegion, runtimeProperties, config);
    if(wcuQuotaReached) {
      console.error("\u001B[31m","🚨 Exit process due Quota Check for WCU 🚨 \n\n","\x1b[0m" + "\n\n");
=======
        const app = new cdk.App();
        new FirewallStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(), {
          config, runtimeProperties: runtimeProperties,
          env: {
            region: deploymentRegion,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
        });
        await getCurrentPrices(PriceRegions[deploymentRegion as RegionString], runtimeProperties, config,deploymentRegion);
        await isPriceCalculated(runtimeProperties);
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
      console.log("\n 🧪 Validation of your ConfigFile: \n   📂 " + CONFIGFILE + "\n\n");
      console.error("\u001B[31m","🚨 Invalid Configuration File 🚨 \n\n","\x1b[0m" + JSON.stringify(validatewaf.errors, null, 2)+ "\n\n");
>>>>>>> 2d597da6 (fix: dependencies, single-header cloudformation warning and log bucket encryption bug)
      process.exit(1);
    }
<<<<<<< HEAD
=======
  }
}
else {
  console.log("File", CONFIGFILE, "not found. - NO CDK ERROR");
}
>>>>>>> 09328a24 (adjust linting)

    const app = new cdk.App();
    new FirewallStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(), {
      config, runtimeProperties: runtimeProperties,
      env: {
        region: deploymentRegion,
        account: process.env.CDK_DEFAULT_ACCOUNT
      },
    });

    const Prices = await GetCurrentPrices(PriceRegions[deploymentRegion as RegionString], runtimeProperties, config,deploymentRegion);
    const PriceCalculated = await isPriceCalculated(runtimeProperties);
  }
})();