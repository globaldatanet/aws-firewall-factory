import { downloadFile} from "./downloader";
import { extractIPAddressesFromJson } from "./ipextractor";
import * as fs from "fs";
import { ManagedIpSet } from "../../types/config/autoUpdatedManagedIpSets";
import {getSsmParameterFromEnvParamString} from "../SharedComponents/services/ssm";
import {ipSetManager, deleteIpSet} from "../SharedComponents/services/waf";
import {deleteSsmParameter} from "../SharedComponents/services/ssm";
import {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse,
  EventBridgeEvent,
} from "aws-lambda";
import { regExReviver as reviver } from "../SharedComponents/helpers";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handler(Event: CdkCustomResourceEvent | EventBridgeEvent<any, string>): Promise<CdkCustomResourceResponse | void> {
  console.log(`Event: ${JSON.stringify(Event)}`);
  const IpSetArns: string[] = [];
  try {
    const ipSetsSettingsParameter = await getSsmParameterFromEnvParamString();
    const ipSetsSettings: ManagedIpSet[] = JSON.parse(ipSetsSettingsParameter, reviver);
    for(const ipSet of ipSetsSettings) {
      if(("ResourceProperties" in Event && Event.ResourceProperties.IpSetName === ipSet.name && "Type" in Event && Event.Type === "aws-firewall-factory-IpSetUpdate") || ("RequestType" in Event && Event.RequestType === "Create" && Event.ResourceProperties.IpSetName === ipSet.name) || "RequestType" in Event && Event.RequestType === "Update" && Event.ResourceProperties.IpSetName === ipSet.name){
        const allcidrs: string[]= [];
        console.log(`♻️  Updating: ${ipSet.name}`);
        for(const location of ipSet.cidrLocations){
          const file = await downloadFile(location.downloadUrl, location.downloadSearchRegexOnUrl , location.outputType);
          const data = fs.readFileSync(file, "utf8");
          const cidrs = extractIPAddressesFromJson(JSON.parse(data),location.OutputInformation.outputTargetKey,location.OutputInformation.outputConditionKey,location.OutputInformation.outputConditionValue,ipSet.ipAddressVersion);
          allcidrs.push(...cidrs);
        }
        // Remove duplicates from the CIDR list
        new Set(allcidrs);
        IpSetArns.push(await ipSetManager(ipSet.region, ipSet.name, ipSet.scope, allcidrs,ipSet.ipAddressVersion, Event.ResourceProperties.Prefix, ipSet.description, ipSet.tags));
        console.log(`📦 IpSet ${ipSet.name} in ${ipSet.region} 🌎 - Updated with ${allcidrs.length} CIDRs`);
      }
      else{
        console.error(` 🚨 Could not find: ${ipSet.name} in SSM Parameter or WAF Service`);
        throw new Error(` 🚨 Could not find: ${ipSet.name} in SSM Parameter or WAF Service`);
      }
    }
    if (("RequestType" in Event && Event.RequestType === "Create" ) || ("RequestType" in Event && Event.RequestType === "Update")){
      return {
        Status: "SUCCESS",
        Reason: "IPSet updated successfully",
        PhysicalResourceId: Event.RequestId,
        StackId: Event.StackId,
        RequestId: Event.RequestId,
        LogicalResourceId: Event.LogicalResourceId,
        Data: { IpSetArn: IpSetArns.toString() },
      };
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    if ("RequestType" in Event && Event.RequestType) {
      if (error instanceof Error) {
        return {
          Status: "FAILED",
          Reason: error.message,
          PhysicalResourceId: Event.RequestId,
          StackId: Event.StackId,
          RequestId: Event.RequestId,
          LogicalResourceId: Event.LogicalResourceId,
          Data: {},
        };
      }
    }
    throw error;
  }
  if ("RequestType" in Event && Event.RequestType === "Delete") {
    try {
      await deleteIpSet(Event.ResourceProperties.Region, Event.ResourceProperties.IpSetName, Event.ResourceProperties.Scope);
      await deleteSsmParameter(`/${Event.ResourceProperties.Prefix.toUpperCase()}/AWS-FIREWALL-FACTORY/MANAGEDIPSETS/${Event.ResourceProperties.IpSetName.toLocaleUpperCase()}/ADDRESSES`);
      return {
        Status: "SUCCESS",
        Reason: "IP set successfully deleted",
        PhysicalResourceId: Event.RequestId,
        StackId: Event.StackId,
        RequestId: Event.RequestId,
        LogicalResourceId: Event.LogicalResourceId,
        Data: {},
      };
    } catch (error) {
      console.error(`❌ Error: ${error}`);
      if (error instanceof Error && "RequestType" in Event && Event.RequestType) {
        return {
          Status: "FAILED",
          Reason: error.message,
          PhysicalResourceId: Event.RequestId,
          StackId: Event.StackId,
          RequestId: Event.RequestId,
          LogicalResourceId: Event.LogicalResourceId,
          Data: {},
        };
      }
      throw error;
    }
  }
}