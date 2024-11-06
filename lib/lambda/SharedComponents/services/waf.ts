/* eslint-disable @typescript-eslint/naming-convention */
import { WAFV2Client, ListAvailableManagedRuleGroupVersionsCommand, ListWebACLsCommand, ListWebACLsCommandInput, ListResourcesForWebACLCommand, ListResourcesForWebACLCommandOutput, Scope, ResourceType, UpdateIPSetCommand, ListIPSetsCommandInput, ListIPSetsCommand, CreateIPSetCommand, IPAddressVersion, CreateIPSetCommandInput, IPSetSummary, UpdateIPSetCommandInput, DeleteIPSetCommand, DeleteIPSetCommandInput, GetIPSetCommand, GetIPSetCommandInput} from "@aws-sdk/client-wafv2";
import { PaginatedManagedRuleGroupVersions, ManagedRuleGroupVersionResponse} from "../types/index";
import {CloudFrontClient, ListDistributionsByWebACLIdCommand, ListDistributionsByWebACLIdCommandOutput} from "@aws-sdk/client-cloudfront";
import {putSsmParameter}  from "./ssm";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { AccountWebAcls, WebAcls} from "../types/index";
import { general } from "../../../types/enums/index";
import {CfnTag} from "aws-cdk-lib";
import {putIpSetMetric} from "./cloudwatch";

export async function getManagedRuleGroupVersions(VendorName: string,Name: string,WafScope: string): Promise<PaginatedManagedRuleGroupVersions> {
  const client = new WAFV2Client({region: process.env.AWS_DEFAULT_REGION});
  const allresponse: PaginatedManagedRuleGroupVersions = {Versions: [], CurrentDefaultVersion: "", Error: ""};
  let scope: Scope;
  if(WafScope === Scope.CLOUDFRONT){
    scope = Scope.CLOUDFRONT;
  } else{
    scope = Scope.REGIONAL;
  }
  const input = {
    VendorName,
    Name,
    Scope: scope
  };
  const command : ListAvailableManagedRuleGroupVersionsCommand = new ListAvailableManagedRuleGroupVersionsCommand(input);
  let throttled = false;
  do {
    try {
      const response = await client.send(command);
      console.log(response);
      if(response.Versions){
        allresponse.Versions.push(...response.Versions);
      }
      if(response.CurrentDefaultVersion){
        allresponse.CurrentDefaultVersion = response.CurrentDefaultVersion;
      }}
    catch(error: unknown){
      if (error instanceof Error) {
        if(error.name.toLocaleLowerCase() === "throttlingexception"){
          throttled = true;
          console.log("⏱️ Throttled - waiting 5 seconds");
          await new Promise(r => setTimeout(r, 5000));
        } else {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`❌ Error: ${error}`);
          console.log(error.message);
          console.log(error.name);
          allresponse.Error = error.message;
          throttled = false;
        }
      }
    }
  } while (throttled);
  return allresponse;
}

export async function getManagedRuleGroupVersion(VendorName: string,Name: string,Scope: string, ParamVersion?: string, Latest?: boolean, enforceUpdate?: boolean): Promise<ManagedRuleGroupVersionResponse> {
  const managerulegroupVersions = await getManagedRuleGroupVersions(VendorName,Name,Scope);
  if(ParamVersion && managerulegroupVersions.Versions && !enforceUpdate){
    console.log("🧪 Version to check: " + ParamVersion);
    if(managerulegroupVersions.Versions.filter((MgnVersion) => MgnVersion.Name === ParamVersion)){
      console.log(`✅ Version found - ${ParamVersion} is valid`);
      return {Version: ParamVersion, State: "SUCCESS", Description: "Specified Version is valid"};
    }else{
      console.log("❌ Specified version not found");
      return {Version: ParamVersion, State: "FAILED", Description: "Specified Version not found"};
    }
  }
  if(Latest){
    const latestVersion = managerulegroupVersions.Versions.reduce((ver, curr) => {
      return curr.LastUpdateTimestamp! > ver.LastUpdateTimestamp! ? curr : ver;
    });
    console.log("✅ Latest version is: " + latestVersion.Name);
    return {Version: latestVersion.Name!, State: "SUCCESS", Description: "Version found"};
  }
  if(managerulegroupVersions.CurrentDefaultVersion){
    console.log("✅ Current default version is: " + managerulegroupVersions.CurrentDefaultVersion);
    return {Version: managerulegroupVersions.CurrentDefaultVersion, State: "SUCCESS", Description: "Version found"};
  }
  if(managerulegroupVersions.Error){
    console.log("❌ Error: " + managerulegroupVersions.Error);
    return {Version: "", State: "FAILED", Description: managerulegroupVersions.Error};
  }
  else{
    console.log("❌ Error: Managed Rule Group without Version found");
    return {Version: "", State: "FAILED", Description: "No Version found"};
  }
}

/**
 * Check if the WebACL is in use
 * @param WebACLArn Arn of the WebACL
 * @param wafclient WAFV2Client
 * @param cdnclient CloudFrontClient
 * @param Scope REGIONAL | CLOUDFRONT
 * @returns true if in use, false if not in use
 */
async function checkwafusage(WebACLArn:string | undefined, wafclient: WAFV2Client, cdnclient:CloudFrontClient , scope: string) {
  const maxRetries = 3;
  let retryCount = 0;
  if(scope === Scope.CLOUDFRONT){
    let InUse = false;
    const assocmd = new ListDistributionsByWebACLIdCommand({WebACLId: WebACLArn});
    while (retryCount < maxRetries) {
      try {
        const assocresponse: ListDistributionsByWebACLIdCommandOutput = await cdnclient.send(assocmd);
        if (assocresponse.DistributionList?.Items) {
          if (assocresponse.DistributionList.Items[0].WebACLId) {
            InUse = true;
            break;
          }
        } else {
          InUse = false;
          break;
        }
      } catch (error) {
        console.log(error);
        await delay(5000);
        retryCount++;
      }
    }
    return InUse;
  }
  else{
    const resourceTypes = ["APPLICATION_LOAD_BALANCER", "API_GATEWAY", "APPSYNC", "COGNITO_USER_POOL", "APP_RUNNER_SERVICE", "VERIFIED_ACCESS_INSTANCE"]; // Used for web ACLs that are scoped for regional applications. A regional application can be an Application Load Balancer (ALB), an Amazon API Gateway REST API, an AppSync GraphQL API, an Amazon Cognito user pool, an App Runner service, or an Amazon Web Services Verified Access instance.
    for (const resourceType of resourceTypes) {
      console.log(` 🏷️ ${resourceType}`);
      let InUse = false;
      const assocmd = new ListResourcesForWebACLCommand({ WebACLArn, ResourceType: resourceType as ResourceType });
      while (retryCount < maxRetries) {
        try {
          const assocresponse: ListResourcesForWebACLCommandOutput = await wafclient.send(assocmd);
          if (assocresponse.ResourceArns && assocresponse.ResourceArns.length !== 0) {
            InUse = true;
            return InUse;
          } else {
            InUse = false;
            break;
          }
        } catch (error) {
          console.log(error);
          await delay(5000);
          retryCount++;
        }
      }
    }
  }
  return false;
}


/**
 * Delay function
 * @param ms number of milliseconds
 * @returns Promise
 */
function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

/**
 * Get all WAFs in the account
 * @param client WAFV2Client
 * @param maxResults number of results per page
 * @param region region
 * @returns WebACLs[]
 */
export async function getallwafs(client: WAFV2Client, maxResults = 10, region: string | undefined) {
  const wafs: WebAcls[] = [];

  // Retrieve CLOUDFRONT WAFs if region is us-east-1
  if (region === "us-east-1") {
    const cloudFrontWAFs = await getWAFs(client, maxResults, "CLOUDFRONT");
    wafs.push(...cloudFrontWAFs);
  }

  // Retrieve REGIONAL WAFs
  const regionalWAFs = await getWAFs(client, maxResults, "REGIONAL");
  wafs.push(...regionalWAFs);

  return wafs;
}

/**
 * Get all Wafs for Specific Scope
 * @param client WAFV2Client
 * @param maxResults number
 * @param scope Scope
 * @returns WebACLs[]
 */
async function getWAFs(client: WAFV2Client, maxResults: number, scope: Scope) {
  const wafs: WebAcls[] = [];

  let NextMarker: string | undefined = undefined;

  do {
    const input: ListWebACLsCommandInput = {
      Scope: scope,
      Limit: maxResults,
      NextMarker // Pass the NextMarker if it exists
    };

    const command = new ListWebACLsCommand(input);
    const response = await client.send(command);

    if (response.WebACLs && response.WebACLs.length > 0) {
      response.WebACLs.forEach(waf => {
        if (waf.ARN && waf.Name) {
          wafs.push({ Name: waf.Name || "undefined", Arn: waf.ARN || "undefined", Scope: scope });
        }
      });
    }

    // Update NextMarker for pagination if it exists
    NextMarker = response.NextMarker;
  } while (NextMarker); // Continue until there are no more pages

  return wafs;
}


/**
 * Check WAF usage in all regions
 * @param credentials AwsCredentialIdentity
 * @param regions string[]
 * @param accountwafs AccountWebACLs
 * @param regexString string
 * @returns AccountWebACLs
 */
export async function checkWafUsageInAccount(credentials: AwsCredentialIdentity, regions: string[], accountwafs: AccountWebAcls, regexString?:string): Promise<AccountWebAcls> {
  for(const region of regions){
    const WebACLsInUse =[];
    const UnusedWebACLs = [];
    const IgnoredWebACLs = [];
    console.log(`🌎 Checking region: ${region}`);
    const client = new WAFV2Client({
      region: region,
      credentials});
    const regionwafs = await getallwafs(client, 100, region);
    for (const waf of regionwafs){
      if(waf.Arn){
        const cdnclient = new CloudFrontClient({region: region, credentials: credentials});
        console.log(`🔍 Checking usage of ${waf.Name}`);
        const InUse = await checkwafusage(waf.Arn, client, cdnclient, waf.Scope);
        accountwafs.TotalWafs++;
        let wafName = waf.Name;
        if(waf.Name.startsWith("FMManagedWebACLV2")){
          console.log(`✂️ ${waf.Name} is a managed FMS WAF, removing the version number suffix`);
          wafName = waf.Name.substring(0, waf.Name.length - 13).endsWith("-") ? waf.Name.substring(0, waf.Name.length - 14) : waf.Name.substring(0, waf.Name.length - 13);
        }
        if(InUse){
          if(regexString && regexString.length > 0){
            // convert a string to a regex https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
            const flags = regexString.replace(/.*\/([gimy]*)$/, "$1");
            const pattern = regexString.replace(new RegExp("^/(.*?)/"+flags+"$"), "$1");
            const regex = pattern === flags ? new RegExp(pattern) : new RegExp(pattern, flags);
            if(regex.test(waf.Name)){
              console.log(`   ⏭️ ${waf.Name} will be skipped`);
              IgnoredWebACLs.push({Name: wafName, Arn: waf.Arn, Scope: waf.Scope});
              accountwafs.IgnoredWafs++;
            }
            else {
              console.log(` ❤️‍🔥 ${waf.Name} in use`);
              accountwafs.WafsInUse++;
              WebACLsInUse.push({Name: wafName, Arn: waf.Arn, Scope: waf.Scope});
            }
          } else {
            console.log(` ❤️‍🔥 ${waf.Name} in use`);
            accountwafs.WafsInUse++;
            WebACLsInUse.push({Name: wafName, Arn: waf.Arn, Scope: waf.Scope});
          }
        } else{
          if(regexString && regexString.length > 0){
            // convert a string to a regex https://stackoverflow.com/questions/874709/converting-user-input-string-to-regular-expression
            const flags = regexString.replace(/.*\/([gimy]*)$/, "$1");
            const pattern = regexString.replace(new RegExp("^/(.*?)/"+flags+"$"), "$1");
            const regex = pattern === flags ? new RegExp(pattern) : new RegExp(pattern, flags);
            if(regex.test(waf.Name)){
              console.log(`   ⏭️ ${waf.Name} will be skipped`);
              IgnoredWebACLs.push({Name: wafName, Arn: waf.Arn, Scope: waf.Scope});
              accountwafs.IgnoredWafs++;
            }
            else {
              console.log(`💔 ${waf.Name} not used`);
              UnusedWebACLs.push({Name: wafName, Arn: waf.Arn, Scope: waf.Scope});
            }
          } else {
            console.log(`💔 ${waf.Name} not used`);
            UnusedWebACLs.push({Name: wafName, Arn: waf.Arn, Scope: waf.Scope});
          }
        }
      }
      await delay(5000);
    }
    if(WebACLsInUse.length > 0 || UnusedWebACLs.length > 0 || IgnoredWebACLs.length > 0){
      accountwafs.WebACLsPerAccount[region] = {WebACLsInUse, UnusedWebACLs, IgnoredWebACLs};
    }
  }
  return accountwafs;
}

async function checkIfIpSetExist(region: general.AWSRegion, ipSetName: string, scope: "REGIONAL" | "CLOUDFRONT"): Promise<IPSetSummary | undefined> {
  const client = new WAFV2Client({region});
  try {
    // List all IP sets in the specified scope
    const input: ListIPSetsCommandInput = { Scope: scope };
    const command = new ListIPSetsCommand(input);
    const response = await client.send(command);
    const ipSet = response.IPSets?.find(ipSet => ipSet.Name === ipSetName);
    // Check if an IP set with the given name exists
    return ipSet;
  } catch (error) {
    console.error("Error checking IP set existence:", error);
    throw new Error(`Error checking IP set existence: ${ipSetName}`);
  }
}

async function getAddressesFromIPSet(region: general.AWSRegion, Name: string, Id: string, Scope: "REGIONAL" | "CLOUDFRONT"): Promise<string[]> {
  const client = new WAFV2Client({region});
  try {
    const input: GetIPSetCommandInput = {
      Id,
      Scope,
      Name
    };
    const command = new GetIPSetCommand(input);
    const response = await client.send(command);
    if(
      response.IPSet &&
    response.IPSet.Addresses &&
    response.IPSet.Addresses.length > 0
    ){
      return response.IPSet.Addresses;
    }
    else{
      console.error("Error getting Addresses from IPset:", response);
    }
  }
  catch (error) {
    console.error("Error getting Addresses from IPset:", error);
    throw error;
  }
}

export async function ipSetManager(Region: general.AWSRegion, Name: string, Scope: "CLOUDFRONT" | "REGIONAL", Addresses: string[], IPAddressVersion: IPAddressVersion, prefix: string, customDescription?: string, tags?: CfnTag[]): Promise<string>{
  const client = new WAFV2Client({region: Region});

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const Description = customDescription ? `${customDescription} - AWS Firewall Factory Managed IP Set - Last updated: ${now} ${timezone}` : `AWS Firewall Factory Managed IP Set - Last updated: ${now} ${timezone}`;
  const existingIpSet = await checkIfIpSetExist(Region, Name, Scope);

  if(existingIpSet && existingIpSet.Id){
    const currentAddresses = await getAddressesFromIPSet(Region, Name, existingIpSet.Id, Scope);
    const missing = currentAddresses.filter(item => Addresses.indexOf(item) < 0);
    if(missing.length > 0 && Addresses.length > 0){
      console.log(`ℹ️ Update existing IpSet: ${Name} - ${existingIpSet.Id}`);
      await putSsmParameter(`/${prefix.toUpperCase()}/AWS-FIREWALL-FACTORY/MANAGEDIPSETS/${Name.toLocaleUpperCase()}/ADDRESSES`, Addresses.toString(), `Addresses for ${Name}`);
      await putIpSetMetric(Region, "AWS-Firewall-Factory", "ManagedIpSets", 1, { Name: "IpSetName", Value: Name });
      const input: UpdateIPSetCommandInput = {
        Name,
        Scope,
        Id: existingIpSet.Id,
        Description,
        Addresses,
        LockToken: existingIpSet.LockToken
      };
      const command = new UpdateIPSetCommand(input);
      const response = await client.send(command);
      console.log(response);
      return existingIpSet.ARN || "";
    } else{
      console.log(`ℹ️ IpSet ${Name} already up to date`);
      await putIpSetMetric(Region, "AWS-Firewall-Factory", "ManagedIpSets", 0, { Name: "IpSetName", Value: Name });
      return existingIpSet.ARN || "";
    }
  }else {
    console.log("ℹ️ Create IpSet");
    const Tags = tags ? tags.map(tag => ({ Key: tag.key, Value: tag.value })) : undefined;
    const input: CreateIPSetCommandInput = {
      Name,
      Scope,
      Addresses,
      Description,
      IPAddressVersion,
      Tags
    };
    const command = new CreateIPSetCommand(input);
    const response = await client.send(command);
    await putSsmParameter(`/${prefix.toUpperCase()}/AWS-FIREWALL-FACTORY/MANAGEDIPSETS/${Name.toLocaleUpperCase()}/ADDRESSES`,Addresses.toString() , `Addresses for ${Name}`);
    await putIpSetMetric(Region, "AWS-Firewall-Factory", "ManagedIpSets", 1, { Name: "IpSetName", Value: Name });
    console.log(response);
    return response.Summary?.ARN || "";
  }

}

export async function deleteIpSet(Region: general.AWSRegion, Name: string, Scope: "CLOUDFRONT" | "REGIONAL"): Promise<void> {
  const client = new WAFV2Client({region: Region});
  const existingIpSet = await checkIfIpSetExist(Region, Name, Scope);
  console.log(`ℹ️ Delete IpSet: ${Name}`);
  if(existingIpSet){
    const input: DeleteIPSetCommandInput = {
      Name,
      Scope,
      Id: existingIpSet.Id,
      LockToken: existingIpSet.LockToken
    };
    const command = new DeleteIPSetCommand(input);
    await client.send(command);
  }
}