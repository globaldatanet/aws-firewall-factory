import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  PolicyDocument,
  PolicyStatement,
  AnyPrincipal,
} from "aws-cdk-lib/aws-iam";
import { CfnSink } from "aws-cdk-lib/aws-oam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export interface CrossAccountSinkProps extends cdk.StackProps {
  principalOrgID: string;
  sinkName: string;
}

export class CrossAccountSink extends Construct {
  public readonly sinkArn: string;

  constructor(scope: Construct, id: string, props: CrossAccountSinkProps) {
    super(scope, id);

    const sinkPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ["oam:CreateLink", "oam:UpdateLink"],
          resources: ["*"],
          principals: [new AnyPrincipal()],
          conditions: {
            "ForAllValues:StringEquals": {
              "oam:PrincipalOrgID": props.principalOrgID,
            },
          },
        }),
      ],
    });

    const sink = new CfnSink(this, props.sinkName, {
      name: props.sinkName,
      policy: sinkPolicy,
    });

    new StringParameter(this, "SinkArnParameter", {
      parameterName: `/oam/${props.sinkName}/arn`,
      stringValue: sink.attrArn,
      description: `The ARN of the OAM sink for region: ${process.env.AWS_REGION}`,
    });
  }
}
