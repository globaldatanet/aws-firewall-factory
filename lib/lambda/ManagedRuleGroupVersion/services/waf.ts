/* eslint-disable @typescript-eslint/naming-convention */
import { WAFV2Client, ListAvailableManagedRuleGroupVersionsCommand} from "@aws-sdk/client-wafv2";
import {ManagedRuleGroupVersionResponse, PaginatedManagedRuleGroupVersions} from "../types/index";


async function getManagedRuleGroupVersions(VendorName: string,Name: string,Scope: string): Promise<PaginatedManagedRuleGroupVersions> {

  const client = new WAFV2Client({region: process.env.AWS_DEFAULT_REGION});
  const allresponse: PaginatedManagedRuleGroupVersions = {Versions: [], CurrentDefaultVersion: "", Error: ""};
  const input = {
    VendorName,
    Name,
    Scope
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
          console.log("⏱️ Throttled - waiting 1 second");
          await new Promise(r => setTimeout(r, 1000));
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