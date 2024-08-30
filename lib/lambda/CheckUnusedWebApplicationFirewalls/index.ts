import {checkWafUsageInAccount} from "../SharedComponents/services/waf";
import { uploadFileToS3 } from "../SharedComponents/services/s3";
import { assumeRole } from "../SharedComponents/services/sts";
import { getaccountalias } from "../SharedComponents/services/iam";
import { getallactiveregions } from "../SharedComponents/services/ec2";


/**
 * Lambda function handler
 * @param {any} Event
 * @returns {Promise<boolean>} returns true if the operation is successful
 */
export const handler = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Event: any,
): Promise<boolean> => {
  console.log("ℹ Lambda is checking for unused WAFs in Account:" + JSON.stringify(Event));
  const roleArn = `arn:aws:iam::${Event}:role/${process.env.CROSS_ACCOUNT_ROLE_NAME}`; // Replace with your role ARN
  const bucketName = process.env.BUCKET_NAME || "undefined";
  const regexString = process.env.REGEX_STRING || "undefined";
  if(Event === process.env.AWS_ACCOUNT_ID){
    console.log("⏭️ Because Account is the FMS Management Account, skipping the WAF check.");
    return true;
  }
  else{
    try {
      const roleSessionName = "aws-firewall-factory-reporter-"+Date.now();
      console.log(`🔑 Assuming role: ${roleArn} - Session Name: ${roleSessionName}`);
      const credentials = await assumeRole(roleArn, roleSessionName);
      const alias = await getaccountalias(credentials);
      console.log(`🔎 Checking WAF usage for AWS Account: ${alias}\n`);
      let accountwafs = {AccountAlias: alias, AccountId: process.env.AWS_ACCOUNT_ID || "undefined" , WebACLsPerAccount: {}, WafsInUse: 0, TotalWafs: 0, IgnoredWafs: 0};
      const regions = await getallactiveregions(credentials);
      accountwafs = await checkWafUsageInAccount(credentials, regions, accountwafs, regexString);
      console.log(`📦 Uploading WAF usage data to S3 bucket: ${bucketName}`);
      await uploadFileToS3(bucketName, "temp/" +accountwafs.AccountAlias + ".json", JSON.stringify(accountwafs), "application/json");
      return true;
    } catch (error) {
      console.error("❌ Error in Lambda function: ", error);
      throw error;
    }
  }

};