import { IncomingWebhook } from "@slack/webhook";
import { MessageAttachment } from "@slack/types";
import { PolicySummary } from "@aws-sdk/client-fms";
import { AccountWebAcls, FmsPolicy } from "../../../SharedComponents/types/index";
import {getProductPrice}  from "../../../../tools/helpers/pricing";
import { PriceRegions, RegionString } from "../../../../types/config";
import * as packageJsonObject from "../../../../../package.json";


export async function unusedNotificationSlack(
  AllWAFs: AccountWebAcls[], UniqueUnusedFMSPolicies:  FmsPolicy[], allFMSPolicies: PolicySummary[], Webhook: string) {
  const totalWafs: number = AllWAFs.reduce((acc, account) => acc + account.TotalWafs, 0);
  const wafsInUse: number = AllWAFs.reduce((acc, account) => acc + account.WafsInUse, 0);
  const ignoredWafs: number = AllWAFs.reduce((acc, account) => acc + account.IgnoredWafs, 0);

  let UnusedWafsInfo = "The following WebACLs are not attached to any AWS resource:\n\n";
  for (const account of AllWAFs) {
    if(account.TotalWafs - account.WafsInUse > 0){
      UnusedWafsInfo += `**${account.AccountAlias}** \n\n\n\n`;
      for (const region in account.WebACLsPerAccount) {
        if(account.WebACLsPerAccount[region].UnusedWebACLs.length !== 0){
          UnusedWafsInfo += `  🌎 ${region}\n\n\n\n‌‌`;
          for(const unusedwaf of account.WebACLsPerAccount[region].UnusedWebACLs) {
            UnusedWafsInfo += `  ﹣ ${unusedwaf.Name}\n\n\n\n`;
          }}
      }
    }
  }


  const region = process.env.AWS_DEFAULT_REGION || "us-east-1";
  const policyPrice = Number(await getProductPrice(PriceRegions[region as RegionString],"AWSFMS","WAFv2"));
  const webAclPrice = Number(await getProductPrice(PriceRegions[region as RegionString] as PriceRegions,"awswaf",undefined,"Web ACL"));
  
  
  const totalcost = (allFMSPolicies.length * policyPrice) + (totalWafs * webAclPrice);
  const potentialsavings = ((UniqueUnusedFMSPolicies.length)*policyPrice) + ((totalWafs - wafsInUse)*webAclPrice);
  const savingsPercentage = (potentialsavings / totalcost) * 100;
  const InfoText =` ℹ firewall cost are calculated based on the AWS Price List API and would occur per month. The calculation is done without considering specifc Rules - so you can exspect to save more money.\n\n All WAF Names from managed WAFs, are shown without the version number suffix.\n\n
    The report was generated on ${new Date().toLocaleString()} from © [aws firewall factory](https://github.com/globaldatanet/aws-firewall-factory) - 🏷️ Version: ${packageJsonObject.version.toString()}\n`;
  const attachments: MessageAttachment ={
    "fallback": "Unutilized Firewall Report",
    "color": "green",
    "title": "Unutilized Firewall Report",
    "text": `${UnusedWafsInfo} \n ${InfoText}`,
    fields: [
      {
        "title": "🧮  Total WebACLs",
        "value": totalWafs.toString(),
        "short": true
      },
      {
        "title": "❌  WebACLs ignored",
        "value":   ignoredWafs.toString(),
        "short": false
      },
      {
        "title": "🗑️  WebACLs not used",
        "value":  (totalWafs - wafsInUse).toString(),
        "short": false
      },
      {
        "title": "🧮  Total Pol",
        "value":   allFMSPolicies.length.toString(),
        "short": false
      },
      {
        "title": "🚨  FMS Pol not used",
        "value":   UniqueUnusedFMSPolicies.length.toString(),
        "short": false
      },
      {
        "title": "💰  Total Cost",
        "value":   `${totalcost} $`,
        "short": false
      },
      {
        "title": "💸  Potential Savings",
        "value":   `${potentialsavings} $`,
        "short": false
      },
      {
        "title": "％  Savings in percent",
        "value":   `${Math.round(savingsPercentage)} %`,
        "short": false
      },
    ]
  };
  const webhook = new IncomingWebhook(Webhook,
    {
      "username": "Unused Firewall Report",
      "icon_emoji": ":firewallfactory:",
      "text": "AWS Firewall Factory Notification",
    });
  const response = await webhook.send(attachments);
  console.log("ℹ️ Slack Notification reponse-Code: " + response?.text);
}
