import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Prerequisites } from "./types/config";

export interface StackProps extends cdk.StackProps {
    readonly config: Prerequisites;
  }


export class PrerequisitesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const account_id = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;

  }
}