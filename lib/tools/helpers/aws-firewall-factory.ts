// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
import cfonts = require("cfonts");
import * as packageJsonObject from "../../../package.json";
import { RuntimeProperties } from "../../types/runtimeprops";
import { Config, ShieldConfig } from "../../types/config";

/**
 * Version of the AWS Firewall Factory - extracted from package.json
 */
const FIREWALL_FACTORY_VERSION = packageJsonObject.version;


/**
 * The function will display info banner and returns deploymentRegion for WAF Stack
 * @param config configuration object of the values.json
 * @return deploymentRegion AWS region, e.g. eu-central-1
 */
export const outputInfoBanner = (config?:Config, shieldConfig?: ShieldConfig) => {
  /**
   * the region into which the stack is deployed
   */
  let deploymentRegion = "";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  cfonts.say("AWS FIREWALL FACTORY", {font: "block",align: "center",colors: ["#00ecbd"],background: "transparent",letterSpacing: 0,lineHeight: 0,space: true,maxLength: "13",gradient: false,independentGradient: false,transitionGradient: false,env: "node",width:"80%"});
  console.log("\n © by globaldatanet");
  console.log("\n🏷  Version: ","\x1B[1m",FIREWALL_FACTORY_VERSION,"\x1b[0m");
  if(shieldConfig || config){
    console.log("\n👤 AWS FMS Administrator Account: ");
    console.log("\x1b[33m",`                        ${process.env.CDK_DEFAULT_ACCOUNT}`,"\x1b[0m");
    }
  if(config){
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
  else{
    deploymentRegion = process.env.REGION || "eu-central-1";
  }
  return deploymentRegion;
};

/**
 * initialize a runtime properties object
 * @returns the runtime properties object
 */
export function initRuntimeProperties() : RuntimeProperties {
  return {
    AllAwsRegions: [],
    GuidanceSummary: [],
    Guidance: {
      rateBasedStatementCount: 0,
      nestedRateStatementCount: 0,
      nestedRateStatementInfo: [],
      overrideActionManagedRuleGroupCount: 0,
      overrideActionManagedRuleGroupInfo: [],
      byteMatchStatementPositionalConstraintCount: 0,
      byteMatchStatementPositionalConstraintInfo: [],
      noRuleLabelsCount: 0,
      noRuleLabelsInfo: [],
    },
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
      IpReputationListCount: 0,
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
      IpReputationListCount: 0,
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
 * The function will check if s3 bucket is Parameter is starting with aws-waf-logs- if Logging Configuration is set to S3
 * @param config Config
 */
export function wrongLoggingConfiguration(config: Config): boolean{
  if(config.General.LoggingConfiguration === "S3"){
    if(!config.General.S3LoggingBucketName.startsWith("aws-waf-logs-")){
      return true;
    }
    return false;
  }
  return false;
}
