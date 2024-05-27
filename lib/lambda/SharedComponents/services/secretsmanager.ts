import {
  SecretsManagerClient,
  GetSecretValueCommand
} from "@aws-sdk/client-secrets-manager";
import { WebHookSecretDefinition} from "../types/index";
  
  
/**
   * Retrieves Secret from Secret Manager
   * @param secredId Id of the Secret
   * @return Defined Secret Object
   */
  
export async function getWebhook(secretId: string): Promise<WebHookSecretDefinition>{
  const smclient = new SecretsManagerClient({});
  console.log(`Getting Secret from SecretsManager with ID: ${secretId}`);
  const getsecret = await smclient.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!getsecret.SecretString) {
    throw new Error(`No secret value found for SecretsManager Secret: ${secretId}`);
  }
  const readSecretFromSecretManager = JSON.parse(getsecret.SecretString) as WebHookSecretDefinition;
  return readSecretFromSecretManager;
}
  