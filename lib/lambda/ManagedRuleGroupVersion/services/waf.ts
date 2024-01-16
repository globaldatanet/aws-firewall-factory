import {ManagedRuleGroupVersionResponse} from "../types/index";
import {getManagedRuleGroupVersions} from "../../SharedComponents/services/waf";


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