import { IAMClient, ListAccountAliasesCommand } from "@aws-sdk/client-iam";
import { AwsCredentialIdentity } from "@aws-sdk/types";
/**
 * Get account alias
 * @returns account alias
 */
export async function getaccountalias(credentials: AwsCredentialIdentity) {
  const client = new IAMClient({region: process.env.AWS_DEFAULT_REGION, credentials: credentials});
  const command = new ListAccountAliasesCommand({});
  const response = await client.send(command);
  if(response.AccountAliases && response.AccountAliases.length !== 0){
    return response.AccountAliases[0];
  }
  else {
    return "No Alias";
  }
}