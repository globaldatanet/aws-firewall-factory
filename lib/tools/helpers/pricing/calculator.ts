/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-for-in-array */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PricingClient, GetProductsCommand, GetProductsCommandInput, FilterType } from "@aws-sdk/client-pricing";
import { RuntimeProperties } from "../../../types/runtimeprops";
import { Config, PriceRegions, ShieldConfig } from "../../../types/config";
import {CloudWatchClient, ListDashboardsCommand, ListDashboardsCommandInput } from "@aws-sdk/client-cloudwatch";
import { ShieldClient, GetSubscriptionStateCommand } from "@aws-sdk/client-shield";


/**
 * Amazon Web Services Price List Service API Endpoint
 */
const PRICING_API_ENDPOINT_REGION = "us-east-1";


/**
 * Find Values in Object - Needed for aws pricing api
 * @param obj object where the key is included
 * @param key key which includes the needed value
 * @returns value from key
 */
function findValues(obj: any, key: string){
  return findValuesHelper(obj, key, []);
}

/**
 * Helper function for findValues seachers in a list of Objects for the correct key
 * @param obj any
 * @param key string
 * @param list any
 * @returns list
 */
function findValuesHelper(obj:any, key:string, list: any) {
  if (!obj) return list;
  if (obj instanceof Array) {
    for (const i of obj) {
      list = list.concat(findValuesHelper(obj[i], key, []));
    }
    return list;
  }
  if (obj[key]) list.push(obj[key]);

  if (typeof obj === "object" && obj !== null) {
    for (const child of Object.values(obj)) {
      list = list.concat(findValuesHelper(child, key, []));
    }
  }
  return list;
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param awsregion  AWS region, e.g. eu-central-1
 * @param runtimeProps runtime properties object, where to store prices
 * @returns true if prices are update in runtimeprops
 */
async function getCurrentWafPrices(deploymentRegion: PriceRegions, runtimeProps: RuntimeProperties, config: Config, awsregion: string): Promise<boolean> {
  console.log("   🔎  Getting current prices for: ", deploymentRegion,"\n");
  try{
    runtimeProps.Pricing.Policy = Number(await getProductPrice(deploymentRegion,"AWSFMS","WAFv2"));
    runtimeProps.Pricing.Rule = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"Rule"));
    runtimeProps.Pricing.WebACL = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"Web ACL"));
    runtimeProps.Pricing.Request =  (await getProductPrice(deploymentRegion,"awswaf",undefined,"Request") * 1000000);
    runtimeProps.Pricing.BotControl = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"AMR Bot Control Entity"));
    const botControlRequest: any = await getProductPrice(deploymentRegion,"awswaf",undefined,undefined,"AMR Bot Control Request Processed");
    runtimeProps.Pricing.BotControlRequest = (botControlRequest[0] * 1000000);
    runtimeProps.Pricing.Captcha = 0.4;
    runtimeProps.Pricing.AccountTakeoverPrevention = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"AMR ATP Entity"));
    const accountTakeoverPreventionRequest: any = await getProductPrice(deploymentRegion,"awswaf",undefined,"AMR ATP Login Attempt");
    runtimeProps.Pricing.AccountTakeoverPreventionRequest = (accountTakeoverPreventionRequest[0] * 1000);
    runtimeProps.Pricing.Dashboard = await getDashboardPrice(awsregion,config);
    return true;
  }
  catch{
    return false;
  }
}

/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @returns price for dashboard
 */
async function getDashboardPrice(deploymentRegion: string, config: Config ): Promise<number> {
  const client = new CloudWatchClient({region: deploymentRegion});
  const input: ListDashboardsCommandInput = {};
  const command = new ListDashboardsCommand(input);
  const response : any = await client.send(command);
  if (!response.DashboardEntries || !response.DashboardEntries[0]) {
    throw new Error("Cant list Dashboards");
  }
  if(config.General.CreateDashboard){
    const dashboardcount = response.DashboardEntries.length + 1;
    if(dashboardcount > 3){
      const usd = 3;
      return usd;
    }
    else{
      const usd = 0;
      return usd;
    }
  }
  else{
    const usd = 0;
    return usd;
  }

}


/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param servicecode The code for the service whose products you want to retrieve.
 * @param operation
 * @returns price for one product
 */
export async function getProductPrice(deploymentRegion: PriceRegions, servicecode: string, operation?: string,group?: string, groupDescription?: string): Promise<number> {
  const client = new PricingClient({region: PRICING_API_ENDPOINT_REGION});
  const filters: {Type: FilterType, Field: string, Value: string}[] = [];
  if(groupDescription){
    filters.push({
      Type: FilterType.TERM_MATCH,
      Field: "groupDescription",
      Value: groupDescription});
  }
  if(group){
    filters.push({
      Type: FilterType.TERM_MATCH,
      Field: "group",
      Value: group});
  }
  if(operation){
    filters.push({
      Type: FilterType.TERM_MATCH,
      Field: "operation",
      Value: operation
    });
  }
  filters.push({
    Type: FilterType.TERM_MATCH,
    Field: "location",
    Value: deploymentRegion
  });

  const input: GetProductsCommandInput = {
    Filters: filters,
    ServiceCode: servicecode
  };
  const command = new GetProductsCommand(input);
  const response : any = await client.send(command);
  if (!response.PriceList || !response.PriceList[0]) {
    throw new Error("Price list does not exist");
  }
  const priceList = response.PriceList[0];
  const usd = findValues(JSON.parse(priceList.toJSON()),"USD");
  return usd || 0;
}


/**
 * The function calculated the price of the deployed WAF
 * @param runtimeProps runtime properties object, where to get prices
 * @returns whether price is successfully calculated or not
 */
export async function isWafPriceCalculated(deploymentRegion: PriceRegions,runtimeProps: RuntimeProperties, config: Config, awsregion: string): Promise<boolean> {
  const shieldSubscriptionState = await getShieldSubscriptionState();
  console.log("\n🛡️  Shield Advanced State: " + shieldSubscriptionState);

  console.log("\n💰 Cost: \n");

  await getCurrentWafPrices(deploymentRegion, runtimeProps, config, awsregion);
  const preprocessfixedcost = (runtimeProps.PreProcess.CustomRuleCount * runtimeProps.Pricing.Rule) + runtimeProps.PreProcess.CustomRuleGroupCount + runtimeProps.PreProcess.ManagedRuleGroupCount;
  const postprocessfixedcost = (runtimeProps.PostProcess.CustomRuleCount * runtimeProps.Pricing.Rule) + runtimeProps.PostProcess.CustomRuleGroupCount + runtimeProps.PostProcess.ManagedRuleGroupCount;
  const captchacost = (runtimeProps.PostProcess.CustomCaptchaRuleCount + runtimeProps.PreProcess.CustomCaptchaRuleCount) * runtimeProps.Pricing.Captcha;
  const botcontrolfixedcost = (runtimeProps.PostProcess.ManagedRuleBotControlCount + runtimeProps.PreProcess.ManagedRuleBotControlCount) * runtimeProps.Pricing.BotControl;
  const atpfixedcost =  (runtimeProps.PostProcess.ManagedRuleATPCount + runtimeProps.PreProcess.ManagedRuleATPCount) * runtimeProps.Pricing.AccountTakeoverPrevention;

  let fixedcost = runtimeProps.Pricing.Policy + runtimeProps.Pricing.WebACL + postprocessfixedcost + preprocessfixedcost + botcontrolfixedcost  + atpfixedcost + runtimeProps.Pricing.Dashboard;
  const requestscost = runtimeProps.Pricing.Request;
  const totalcost = fixedcost + (requestscost * 5) + (captchacost * 5);

  if (shieldSubscriptionState && shieldSubscriptionState === "ACTIVE") {
    fixedcost = botcontrolfixedcost  + atpfixedcost + runtimeProps.Pricing.Dashboard;
  }

  console.log("   WAF Rules cost: " + fixedcost + " $ per month");
  console.log("   WAF Requests: " + requestscost.toFixed(2) + " $ pro 1 mio requests");

  if (captchacost > 0) {
    console.log("   WAF Analysis fee:\n    Captcha: " + captchacost + "$ per thousand challenge attempts analyzed");
  } else {
    console.log(" ");
  }

  console.log("\n   Total WAF cost (monthly): "+ totalcost + " $ *");
  console.log("\n    * This costs are based on the expectation that the WAF gets 5 mio requests per month. ");

  if (atpfixedcost !== 0) {
    console.log("\n    * This costs are based on the expectation that 10.000 login attempts were analyzed. ");
  }

  console.log("\n      ℹ The costs are calculated based on the provided information at https://aws.amazon.com/waf/pricing/. ");

  if (botcontrolfixedcost !== 0) {
    console.log("     The deployed WAF includes BotControl rules this costs an extra fee of " + runtimeProps.Pricing.BotControl + " $ and " + runtimeProps.Pricing.BotControlRequest + "$ pro 1 mio requests (10 mio request Free Tier). \n     These costs are already included in the price calculation.");
  }

  if (atpfixedcost !== 0) {
    console.log("     The deployed WAF includes Account Takeover Prevention rules this costs an extra fee of " + runtimeProps.Pricing.AccountTakeoverPrevention + " $ and " + runtimeProps.Pricing.AccountTakeoverPreventionRequest + " $ per thousand login attempts analyzed (10,000 attempts analyzed Free Tier). \n     These costs are already included in the price calculation.");
  }

  if (runtimeProps.Pricing.Dashboard !== 0) {
    console.log("     The deployed WAF includes CloudWatch Dashboard and you have more than 3 Dashboards (Free tier), so you will need to pay " + runtimeProps.Pricing.Dashboard + "$ for this CloudWatch Dashboard. \n     These costs are already included in the price calculation.");
  }

  if (shieldSubscriptionState === "ACTIVE") {
    console.log("     AWS WAF WebACLs or Rules created by Firewall Manager - are Included in AWS Shield Advanced. More information at https://aws.amazon.com/firewall-manager/pricing/.");
  }

  console.log("\n\n");
  const pricecalculated = true;
  return pricecalculated;
}

async function getShieldSubscriptionState(){
  const client = new ShieldClient({region: PRICING_API_ENDPOINT_REGION});
  const input = {};
  const command = new GetSubscriptionStateCommand(input);
  const subscriptionState = (await client.send(command)).SubscriptionState;
  return subscriptionState;
}

/**
 * The function calculated the price of the deployed WAF
 * @param runtimeProps runtime properties object, where to get prices
 * @returns whether price is successfully calculated or not
 */
export async function isShieldPriceCalculated(shieldconfig: ShieldConfig): Promise<boolean> {
  const shieldSubscriptionState = await getShieldSubscriptionState();
  console.log("\n🛡️  Shield Advanced State: " + shieldSubscriptionState);

  console.log("\n💰 Cost: \n");
  console.log("   🛡️ Shield Advanced Subscription: \n     3000 $ per month (whole Organization)\n");
  console.log("   ⌗ Data Transfer Out Usage Fees: \n");

  if(shieldconfig.resourceType === "AWS::CloudFront::Distribution" || shieldconfig.resourceType === "AWS::GlobalAccelerator::Accelerator"){
    console.log("     first 100 TB 0.025 $ per GB \n      next 400 TB 0.020 $ per GB");
  }
  else if(shieldconfig.resourceType === "AWS::ElasticLoadBalancingV2::LoadBalancer" || shieldconfig.resourceType === "AWS::ElasticLoadBalancing::LoadBalancer" || shieldconfig.resourceType === "AWS::EC2::EIP"){
    console.log("     first 100 TB 0.05 $ per GB \n      next 400 TB 0.04 $ per GB");
  }
  console.log("\n      ℹ The costs are calculated based on the provided information at https://aws.amazon.com/shield/pricing/. ");

  return true;
}