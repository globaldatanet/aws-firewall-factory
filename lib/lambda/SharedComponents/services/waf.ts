/* eslint-disable @typescript-eslint/naming-convention */
import { WAFV2Client, ListAvailableManagedRuleGroupVersionsCommand, Scope} from "@aws-sdk/client-wafv2";
import { PaginatedManagedRuleGroupVersions} from "../types/index";


export async function getManagedRuleGroupVersions(VendorName: string,Name: string,WafScope: string): Promise<PaginatedManagedRuleGroupVersions> {
  const client = new WAFV2Client({region: process.env.AWS_DEFAULT_REGION});
  const allresponse: PaginatedManagedRuleGroupVersions = {Versions: [], CurrentDefaultVersion: "", Error: ""};
  let scope: Scope;
  if(WafScope === "CLOUDFRONT"){
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


