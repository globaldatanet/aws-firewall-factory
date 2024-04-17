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
  Event: CdkCustomResourceEvent,
): Promise<CdkCustomResourceResponse> => {
  let ManagedVersionInfo: ManagedRuleGroupVersionResponse;
  let ParamVersion: string | undefined;
  let Latest: boolean;
  let enforceUpdate: boolean;
  console.log("Lambda is invoked with:" + JSON.stringify(Event));
  
  const Response: CdkCustomResourceResponse = {
    StackId: Event.StackId,
    RequestId: Event.RequestId,
    LogicalResourceId: Event.LogicalResourceId,
    PhysicalResourceId: `${Event.ResourceProperties.Name}-version`,
  };

  if (Event.RequestType === "Delete") {
    Response.Status = "SUCCESS";
    Response.Data = { Result: "Delete Event" };
    return Response;
  }
  console.log(`🔎 Searching Managed Rule Version for: \n 🏬  ${Event.ResourceProperties.VendorName} \n 🏷️  ${Event.ResourceProperties.Name} \n 🌏  ${Event.ResourceProperties.Scope}`);
  if (Event.RequestType === "Update") {
    console.log("🔄 Update Event");
    if(Event.OldResourceProperties.Version !== "" || Event.ResourceProperties.EnforceUpdate !== "false" || Event.ResourceProperties.ManagedRuleGroupVersion !== ""){ParamVersion = Event.OldResourceProperties.Version;}
  }
  try {
    if(Event.ResourceProperties.ManagedRuleGroupVersion !== ""){
      ParamVersion = Event.ResourceProperties.ManagedRuleGroupVersion;
    }
    Latest = Event.ResourceProperties.Latest === "true" ? true : false;
    enforceUpdate = Event.ResourceProperties.EnforceUpdate === "true" ? true : false;
    ManagedVersionInfo = await getManagedRuleGroupVersion(Event.ResourceProperties.VendorName, Event.ResourceProperties.Name, Event.ResourceProperties.Scope, ParamVersion, Latest, enforceUpdate);
    if(ManagedVersionInfo.State === "SUCCESS"){
      Response.Status = "SUCCESS";
      Response.Data = { Version: ManagedVersionInfo.Version, Result: ManagedVersionInfo.Description };
      return Response;
    }
    else{
      Response.Status = "FAILED";
      Response.Data = { Result: ManagedVersionInfo.Description };
      return Response;
    }
  }
  catch (error) {
    console.log(`❌ Error: ${error}`);
    if (error instanceof Error) {
      Response.Reason = error.message;
    }
    Response.Status = "FAILED";
    Response.Data = { Result: error };
    return Response;
  }
};