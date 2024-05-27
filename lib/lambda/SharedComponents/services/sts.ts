import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { AwsCredentialIdentity } from "@aws-sdk/types";
/**
 * Assume the role with the specified ARN and return the temporary credentials.
 * @param roleArn The ARN of the role to assume.
 * @param roleSessionName A name for the assumed role session.
 * @returns The temporary credentials for the assumed role.
 */
export async function assumeRole(
  roleArn: string,
  roleSessionName: string
): Promise<AwsCredentialIdentity> {
  // Create STS client
  const stsClient = new STSClient({ region: process.env.AWS_DEFAULT_REGION});

  // Create parameters for the AssumeRoleCommand
  const params = {
    RoleArn: roleArn,
    RoleSessionName: roleSessionName,
  };

  try {
    // Assume the role
    const command = new AssumeRoleCommand(params);
    const response = await stsClient.send(command);

    // Extract and return the temporary credentials
    const credentials = response.Credentials;
    if (credentials) {
      const assumedroleCredentials =  {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!,
      };
      return assumedroleCredentials;
    } else {
      throw new Error("Assumed role credentials not found in response.");
    }
  } catch (error) {
    console.error("Error assuming role:", error);
    throw error;
  }
}
