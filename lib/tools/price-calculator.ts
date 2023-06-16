import { PricingClient, GetProductsCommand, GetProductsCommandInput } from "@aws-sdk/client-pricing";
import { RuntimeProperties } from "../types/runtimeprops";
import { Config } from "../types/config";
import { PriceRegions } from "../types/config";
import {CloudWatchClient, ListDashboardsCommand, ListDashboardsCommandInput } from "@aws-sdk/client-cloudwatch";
import { ShieldClient, GetSubscriptionStateCommand } from "@aws-sdk/client-shield"


/**
 * Amazon Web Services Price List Service API Endpoint
 */
const PRICING_API_ENDPOINT_REGION = "us-east-1";


/**
 *
 * @param obj object where the key is included
 * @param key key which includes the needed value
 * @returns value from key
 */
function findValues(obj: any, key: string){
  return findValuesHelper(obj, key, []);
}

function findValuesHelper(obj:any, key:string, list: any) {
  if (!obj) return list;
  if (obj instanceof Array) {
    for (const i in obj) {
      list = list.concat(findValuesHelper(obj[i], key, []));
    }
    return list;
  }
  if (obj[key]) list.push(obj[key]);

  if ((typeof obj === "object") && (obj !== null) ){
    const children = Object.keys(obj);
    if (children.length > 0){
      for (let i = 0; i < children.length; i++ ){
        list = list.concat(findValuesHelper(obj[children[i]], key, []));
      }
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
export async function GetCurrentPrices(deploymentRegion: PriceRegions, runtimeProps: RuntimeProperties, config: Config, awsregion: string): Promise<boolean> {
  try{
    runtimeProps.Pricing.Policy = Number(await getProductPrice(deploymentRegion,"AWSFMS","WAFv2"));
    runtimeProps.Pricing.Rule = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"Rule"));
    runtimeProps.Pricing.WebACL = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"Web ACL"));
    runtimeProps.Pricing.Request =  (await getProductPrice(deploymentRegion,"awswaf",undefined,"Request") * 1000000);
    runtimeProps.Pricing.BotControl = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"AMR Bot Control Entity"));
    const BotControlRequest: any = await getProductPrice(deploymentRegion,"awswaf",undefined,undefined,"AMR Bot Control Request Processed");
    runtimeProps.Pricing.BotControlRequest = (BotControlRequest[0] * 1000000);
    runtimeProps.Pricing.Captcha = 0.4;
    runtimeProps.Pricing.AccountTakeoverPrevention = Number(await getProductPrice(deploymentRegion,"awswaf",undefined,"AMR ATP Entity"));
    const AccountTakeoverPreventionRequest: any = await getProductPrice(deploymentRegion,"awswaf",undefined,"AMR ATP Login Attempt");
    runtimeProps.Pricing.AccountTakeoverPreventionRequest = (AccountTakeoverPreventionRequest[0] * 1000);
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
      const USD = 3;
      return USD;
    }
    else{
      const USD = 0;
      return USD;
    }
  }
  else{
    const USD = 0;
    return USD;
  }

}


/**
 *
 * @param deploymentRegion AWS region, e.g. eu-central-1
 * @param servicecode The code for the service whose products you want to retrieve.
 * @param operation
 * @returns price for one product
 */
async function getProductPrice(deploymentRegion: PriceRegions, servicecode: string, operation?: string,group?: string, groupDescription?: string): Promise<number> {
  const client = new PricingClient({region: PRICING_API_ENDPOINT_REGION});
  const Filters: {Type: string, Field: string, Value: string}[] = [];
  if(groupDescription){
    Filters.push({
      Type: "TERM_MATCH",
      Field: "groupDescription",
      Value: groupDescription});
  }
  if(group){
    Filters.push({
      Type: "TERM_MATCH",
      Field: "group",
      Value: group});
  }
  if(operation){
    Filters.push({
      Type: "TERM_MATCH",
      Field: "operation",
      Value: operation
    });
  }
  Filters.push({
    Type: "TERM_MATCH",
    Field: "location",
    Value: deploymentRegion
  });

  const input: GetProductsCommandInput = {
    Filters,
    ServiceCode: servicecode
  };
  const command = new GetProductsCommand(input);
  const response : any = await client.send(command);
  if (!response.PriceList || !response.PriceList[0]) {
    throw new Error("Price list does not exist");
  }
  const priceList = response.PriceList[0] as any;
  const USD = findValues(JSON.parse(priceList.toJSON()),"USD");
  return USD || 0;
}


/**
 * The function calculated the price of the deployed WAF
 * @param runtimeProps runtime properties object, where to get prices
 * @returns whether price is successfully calculated or not
 */
export async function isPriceCalculated(runtimeProps: RuntimeProperties): Promise<string> {
  const preprocessfixedcost = (runtimeProps.PreProcess.CustomRuleCount * runtimeProps.Pricing.Rule) + runtimeProps.PreProcess.CustomRuleGroupCount + runtimeProps.PreProcess.ManagedRuleGroupCount;
  const postprocessfixedcost = (runtimeProps.PostProcess.CustomRuleCount * runtimeProps.Pricing.Rule) + runtimeProps.PostProcess.CustomRuleGroupCount + runtimeProps.PostProcess.ManagedRuleGroupCount;
  const captchacost = (runtimeProps.PostProcess.CustomCaptchaRuleCount + runtimeProps.PreProcess.CustomCaptchaRuleCount) * runtimeProps.Pricing.Captcha;
  const botcontrolfixedcost = (runtimeProps.PostProcess.ManagedRuleBotControlCount + runtimeProps.PreProcess.ManagedRuleBotControlCount) * runtimeProps.Pricing.BotControl;
  const atpfixedcost =  (runtimeProps.PostProcess.ManagedRuleATPCount + runtimeProps.PreProcess.ManagedRuleATPCount) * runtimeProps.Pricing.AccountTakeoverPrevention;
  let fixedcost = runtimeProps.Pricing.Policy + runtimeProps.Pricing.WebACL + postprocessfixedcost + preprocessfixedcost + botcontrolfixedcost  + atpfixedcost + runtimeProps.Pricing.Dashboard;
  const requestscost = runtimeProps.Pricing.Request;
  const totalcost = fixedcost + (requestscost * 5) + (captchacost * 5);
  const ShieldSubscriptionState = await getShieldSubscriptionState();
  console.log("\n🛡️  Shield Advanced State: " + ShieldSubscriptionState?.toLowerCase())
  console.log("\n💰 Cost: \n");
  if(ShieldSubscriptionState === "ACTIVE"){
    fixedcost = botcontrolfixedcost  + atpfixedcost + runtimeProps.Pricing.Dashboard
  }
  console.log("   WAF Rules cost: " + fixedcost + " $ per month");
  console.log("   WAF Requests: "+ requestscost + " $ pro 1 mio requests");
  (captchacost > 0) ? console.log("   WAF Analysis fee:\n    Captcha: " +captchacost +"$ per thousand challenge attempts analyzed") : " ";
  console.log("\n   Total WAF cost (monthly): "+ totalcost + " $ *");
  console.log("\n    * This costs are based on expectation that the WAF gets 5 mio requests per month. ");
  (atpfixedcost !== 0) ? console.log("\n    *This costs are based on expectation that 10.000 login attempts where analyzed. ") : "";
  console.log("\n   ℹ The costs are calculated based on the provided information at https://aws.amazon.com/waf/pricing/. ");
  (botcontrolfixedcost !== 0) ? console.log("     The deployed WAF includes BotControl rules this costs an extra fee of "+runtimeProps.Pricing.BotControl +" $ and " +runtimeProps.Pricing.BotControlRequest +"$ pro 1 mio requests (10 mio request Free Tier). \n     These costs are already included in the price calculation.") : "";
  (atpfixedcost !== 0) ? console.log("     The deployed WAF includes Account Takeover Prevention rules this costs an extra fee of "+runtimeProps.Pricing.AccountTakeoverPrevention+" $ and " + runtimeProps.Pricing.AccountTakeoverPreventionRequest +" $ per thousand login attempts analyzed (10,000 attempts analyzed Free Tier). \n     These costs are already included in the price calculation.") : "";
  (runtimeProps.Pricing.Dashboard !== 0) ? console.log("     The deployed WAF includes CloudWatch Dashboard and you have more than 3 Dashboards (Free tier), so you will need to pay " + runtimeProps.Pricing.Dashboard+ "$ for this CloudWatch Dashboard. \n     These costs are already included in the price calculation.") : "";
  (ShieldSubscriptionState === "Active") ? console.log("     AWS WAF WebACLs or Rules created by Firewall Manager - are Included in AWS Shield Advanced. More information at https://aws.amazon.com/firewall-manager/pricing/.") : "";
  console.log("\n\n");
  const pricecalculated = "True";
  return pricecalculated;
}

async function getShieldSubscriptionState(){
  const client = new ShieldClient({region: PRICING_API_ENDPOINT_REGION});
  const input = {};
  const command = new GetSubscriptionStateCommand(input);
  const SubscriptionState = (await client.send(command)).SubscriptionState;
  return SubscriptionState
}