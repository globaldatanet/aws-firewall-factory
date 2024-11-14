import { SSMClient, GetParameterCommand, PutParameterCommand, DeleteParameterCommand, PutParameterCommandInput, ParameterType } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: process.env.AWS_REGION });

const { PARAM_NAME } = process.env;

let param: string;

/**
 * Get Parameter Store Parameter Value String from Environment Variable
 * @return  Parameter Store Parameter Value as string
 */

export async function getSsmParameterFromEnvParamString(){
  const commandInput = {
    Name: PARAM_NAME
  };
  const command = new GetParameterCommand(commandInput);
  const ssmResponse = await client.send(command);
  if (ssmResponse.Parameter && ssmResponse.Parameter.Value) {
    param = ssmResponse.Parameter.Value;
  }
  return param;
}


/**
 * Put Parameter Store Parameter Value String
 * @return  Parameter Store Parameter Value as string
 */
export async function putSsmParameter(Name: string, Value: string, Description: string) {
  try {
    const commandInput: PutParameterCommandInput = {
      Name,
      Value,
      Description,
      Type: ParameterType.STRING,
      Tier: "Advanced",
    };
    const command = new PutParameterCommand(commandInput);
    const ssmResponse = await client.send(command);
    console.log(`ℹ️ Update SSM Parameter Store PARAMETER: ${Name} - ${ssmResponse.Version}`);
  }
  catch (error) {
    console.error("❌ Error in SSM Parameter Store: " + error);
    throw error;
  }
}

export async function deleteSsmParameter(Name: string) {
  try {
    const commandInput = {
      Name,
    };
    const command = new DeleteParameterCommand(commandInput);
    const ssmResponse = await client.send(command);
    console.log(`ℹ️ Delete SSM Parameter Store PARAMETER: ${Name} - Result: ${ssmResponse.$metadata.httpStatusCode}`);
  }
  catch (error) {
    console.error("❌ Error in SSM Parameter Store: " + error);
    throw error;
  }
}