/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  CdkCustomResourceEvent,
  CdkCustomResourceResponse
} from "aws-lambda";
import { getManagedRuleGroupVersion } from "./services/waf";
import {ManagedRuleGroupVersionResponse} from "./types/index";

export const handler = async (
  event: CdkCustomResourceEvent,
): Promise<CdkCustomResourceResponse> => {
  let ManagedVersionInfo: ManagedRuleGroupVersionResponse;
  let ParamVersion: string | undefined;
  let Latest: boolean;
  let enforceUpdate: boolean;
  console.log("Lambda is invoked with:" + JSON.stringify(event));
  
  const response: CdkCustomResourceResponse = {
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: `${event.ResourceProperties.Name}-version`,
  };

  if (event.RequestType === "Delete") {
    response.Status = "SUCCESS";
    response.Data = { Result: "Delete Event" };
    return response;
  }
  console.log(`🔎 Searching Managed Rule Version for: \n 🏬  ${event.ResourceProperties.VendorName} \n 🏷️  ${event.ResourceProperties.Name} \n 🌏  ${event.ResourceProperties.Scope}`);
  if (event.RequestType === "Update") {
    console.log("🔄 Update Event");
    event.OldResourceProperties.Version === "" || event.ResourceProperties.EnforceUpdate === "true" ? ParamVersion = undefined : ParamVersion = event.OldResourceProperties.Version;
  }
  try {
    event.ResourceProperties.ManagedRuleGroupVersion === "" ? ParamVersion = undefined : ParamVersion = event.ResourceProperties.ManagedRuleGroupVersion;
    event.ResourceProperties.Latest === "true" ? Latest = true : Latest = false;
    event.ResourceProperties.EnforceUpdate === "false" ? enforceUpdate = false : enforceUpdate = true;
    ManagedVersionInfo = await getManagedRuleGroupVersion(event.ResourceProperties.VendorName, event.ResourceProperties.Name, event.ResourceProperties.Scope, ParamVersion, Latest, enforceUpdate);
    if(ManagedVersionInfo.State === "SUCCESS"){
      response.Status = "SUCCESS";
      response.Data = { Version: ManagedVersionInfo.Version, Result: ManagedVersionInfo.Description };
      return response;
    }
    else{
      response.Status = "FAILED";
      response.Data = { Result: ManagedVersionInfo.Description };
      return response;
    }
  }
  catch (error) {
    console.log(`❌ Error: ${error}`);
    if (error instanceof Error) {
      response.Reason = error.message;
    }
    response.Status = "FAILED";
    response.Data = { Result: error };
    return response;
  }
};