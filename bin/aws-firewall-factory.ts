#!/usr/bin/env node
import { FirewallStack } from "../lib/firewall-stack";
import { PrerequisitesStack } from "../lib/prerequisites-stack";
import * as cdk from "aws-cdk-lib";
import { realpathSync, existsSync } from "fs";
import { validateWaf, validatePrerequisites, wrongLoggingConfiguration } from "../lib/tools/config-validator";
import { Config, Prerequisites, PriceRegions, RegionString } from "../lib/types/config";
import { isPolicyQuotaReached, isWcuQuotaReached, setOutputsFromStack, initRuntimeProperties } from "../lib/tools/helpers";
import {isPriceCalculated, getCurrentPrices} from "../lib/tools/price-calculator";
import * as packageJsonObject from "../package.json";
import { ValidateFunction } from "ajv";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
import cfonts = require("cfonts");
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

const outputInfoBanner = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  cfonts.say("AWS FIREWALL FACTORY", {font: "block",align: "left",colors: ["#00ecbd"],background: "transparent",letterSpacing: 0,lineHeight: 0,space: true,maxLength: "13",gradient: false,independentGradient: false,transitionGradient: false,env: "node",width:"80%"});
  console.log("\n © by globaldatanet");
  console.log("\n🏷  Version: ","\x1b[4m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  console.log("👤 AWS Account used: ","\x1b[33m","\n                      " + process.env.CDK_DEFAULT_ACCOUNT,"\x1b[0m");
};

const logInvalidConfigFileAndExit = (invalidFileType: "ConfigFile" | "IPSet", validationFilePath: string, ajvValidatorFunction: ValidateFunction): void => {
  outputInfoBanner();
  console.log(`\n 🧪 Validation of your ${invalidFileType}: \n   📂 ` + validationFilePath + "\n\n");
  console.error("\u001B[31m",`🚨 Invalid ${invalidFileType} File 🚨 \n\n`,"\x1b[0m" + JSON.stringify(ajvValidatorFunction.errors, null, 2)+ "\n\n");
  process.exit(1);
};

if(!CONFIGFILE || !existsSync(CONFIGFILE)) {
  console.log("Config file ", CONFIGFILE, " not found. - NO CDK ERROR");
  process.exit(1);
}

(async () => { 
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config: Config = require(realpathSync(CONFIGFILE));
  if (!validateWaf(config)) logInvalidConfigFileAndExit("ConfigFile", realpathSync(CONFIGFILE), validateWaf);

  // ---------------------------------------------------------------------
  // Deploying prerequisite stack

  if(process.env.PREREQUISITE === "true") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const prerequisites: Prerequisites = require(realpathSync(CONFIGFILE));
    if(!validatePrerequisites(prerequisites)) logInvalidConfigFileAndExit("ConfigFile", realpathSync(CONFIGFILE), validatePrerequisites);

    outputInfoBanner();
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

    outputInfoBanner();
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
          console.error("\u001B[31m","🚨 ERROR: Exit process due Quota Check for Policies 🚨 \n\n","\x1b[0m" + "\n\n");
          process.exit(1);
        }
      }
    }
    else{
      await setOutputsFromStack(deploymentRegion, runtimeProperties, config);
      console.log("#️⃣  Deployment Hash for this WAF: "+  config.General.DeployHash);
    }

    console.log("🔥 Deploy FMS Policy: " + config.General.Prefix.toUpperCase() + "-" + config.WebAcl.Name.toUpperCase()+ "-" + config.General.Stage + "-" + config.General.DeployHash + "\n ⦂ Type: " +config.WebAcl.Type + "\n📚 Stackname: ","\u001b[32m",config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(),"\u001b[0m");

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
      for(const IpSet of config.WebAcl.IPSets) {
        console.log("   ➕ " + IpSet.Name);
        console.log("      ⚙️  [" + IpSet.IPAddressVersion + "] | 🌎 [" + config.WebAcl.Scope+ "]");
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
    const app = new cdk.App();
    new FirewallStack(app, config.General.Prefix.toUpperCase() + "-WAF-" + config.WebAcl.Name.toUpperCase() +"-"+config.General.Stage.toUpperCase() +"-"+config.General.DeployHash.toUpperCase(), {
      config, runtimeProperties: runtimeProperties,
      env: {
        region: deploymentRegion,
        account: process.env.CDK_DEFAULT_ACCOUNT
      },
    });

    const Prices = await getCurrentPrices(PriceRegions[deploymentRegion as RegionString], runtimeProperties, config,deploymentRegion);
    const PriceCalculated = await isPriceCalculated(runtimeProperties);
  }
})();