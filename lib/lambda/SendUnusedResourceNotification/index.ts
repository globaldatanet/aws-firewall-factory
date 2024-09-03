import { listFilesInBucket, getFileContent } from "../SharedComponents/services/s3";
import { AccountWebAcls, UnutilizedFirewalls } from "../SharedComponents/types/index";
import { unusedNotificationTeams } from "./messengers/teams/notification";
import {unusedNotificationSlack} from "./messengers/slack/notification";
import  { uploadFileToS3, deleteS3FilesWithPrefix } from "../SharedComponents/services/s3";
import {detectUnusedFmsPolicies} from "./helper";
import { getWebhook } from "../SharedComponents/services/secretsmanager";
import { getallactiveregions } from "../SharedComponents/services/ec2";
import { listAllPolicies } from "../SharedComponents/services/fms";
import { PolicySummary } from "@aws-sdk/client-fms";
/**
 * Lambda function handler
 * @param {any} Event
 * @returns {Promise<string[]>} MemberAccounts
 */
export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Event: any,
): Promise<boolean> => {

  console.log("ƛ Lambda is invoked with:" + JSON.stringify(Event));
  const bucketName = process.env.BUCKET_NAME || "undefined";
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
  const allwebacls: AccountWebAcls[] = [];
  console.log("📁 Importing WAF Usage Files from s3:");
  const files = await listFilesInBucket(bucketName, "temp");
  for (const file of files) {
    console.log(`📄 Importing File: ${file}`);
    const content = await getFileContent(bucketName, file);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    allwebacls.push(JSON.parse(content));
  }

  const WebhookSecret = await getWebhook(WEBHOOK_SECRET);

  const regions = await getallactiveregions();
  const allFMSPolicies: PolicySummary[] = [];
  for (const region of regions){
    console.log(`🌍 Region: ${region}`);
    const regionpolicy = await listAllPolicies(region);
    allFMSPolicies.push(...regionpolicy);
  }
  const unutilizedFMSPolicies = detectUnusedFmsPolicies(allwebacls);


  const key = "archiv/LatestUnusedFirewallReport" + Date.now() + ".json";
  const exportFile: UnutilizedFirewalls = {AccountWebACLs: allwebacls, UnutilizedFMSPolicies: unutilizedFMSPolicies};
  await uploadFileToS3(bucketName, key, JSON.stringify(exportFile), "application/json");

  switch(WebhookSecret.Messenger){
    case "Slack":
      await unusedNotificationSlack(allwebacls, unutilizedFMSPolicies, allFMSPolicies, WebhookSecret.WebhookUrl);
      break;
    case "Teams":
      await unusedNotificationTeams(allwebacls, unutilizedFMSPolicies, allFMSPolicies, bucketName, key, WebhookSecret.WebhookUrl);
      break;
  }
  try{
    await deleteS3FilesWithPrefix(bucketName, "temp");
  } catch(error) {
    console.error("❌ Error deleting files from S3 - Error:", error);
    throw(error);
  }
  return true;
};