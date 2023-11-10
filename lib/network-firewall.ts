import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_networkfirewall as networkfirewall } from "aws-cdk-lib";
import { Config } from "./types/config";
import { RuntimeProperties } from "./types/runtimeprops";

export interface ConfigStackProps extends cdk.StackProps {
    readonly config: Config;
    runtimeProperties: RuntimeProperties;
  }
  
export class NetworkfirewallStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);
    const accountId = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

  }
}