import { Rule, ManagedRuleGroup } from "./fms";
import { aws_fms as fms } from "aws-cdk-lib";
import internal = require("events");
export interface Config {
  readonly General: {
    readonly Prefix: string,
    readonly Stage: string,
    readonly FireHoseKeyArn: string,
    readonly S3LoggingBucketName: string,
    DeployHash: string,
    readonly SecuredDomain: Array<string>,
    readonly CreateDashboard?: boolean,
  },
  readonly WebAcl:{
    readonly Name: string,
    readonly IncludeMap:  fms.CfnPolicy.IEMapProperty,
    readonly ExcludeMap?: fms.CfnPolicy.IEMapProperty,
    readonly Scope: "CLOUDFRONT" | "REGIONAL",
    readonly Type: "AWS::ElasticLoadBalancingV2::LoadBalancer" | "AWS::CloudFront::Distribution" | "AWS::ApiGatewayV2::Api" | "AWS::ApiGateway::Stage",
    readonly ResourceTags?: Array<fms.CfnPolicy.ResourceTagProperty>,
    readonly ExcludeResourceTags?: boolean,
    readonly RemediationEnabled?: boolean,
    readonly ResourcesCleanUp?: boolean,
    readonly PreProcess: RuleGroupSet,
    readonly PostProcess: RuleGroupSet
  },
}

export interface Prerequisites {
  readonly General: {
    readonly Prefix: string,
  },
  readonly Logging: {
      readonly BucketProperties?: {
        readonly BucketName?: string,
        readonly KmsEncryptionKey: boolean,
        readonly ObjectLock?: {
          readonly Days: number,
          readonly Mode: "GOVERNANCE" | "COMPLIANCE"
        }

      },
      readonly FireHoseKey?: {
        readonly KeyAlias: string
      },
      readonly CrossAccountIdforPermissions?: string,
  }
}

export enum ObjectLockMode {
  GOVERNANCE = "GOVERNANCE",
  COMPLIANCE = "COMPLIANCE"
}


export type RegionString = "us-west-2" | "us-west-1" | "us-east-2" | "us-east-1" | "ap-south-1"| "ap-northeast-2" | "ap-northeast-1" | "ap-southeast-1" | "ap-southeast-2" | "ca-central-1" | "cn-north-1" | "eu-central-1" | "eu-west-1" | "eu-west-2" | "eu-west-3" | "sa-east-1" | "us-gov-west-1" | "ap-east-1" | "ap-southeast-3" | "ap-northeast-3" | "eu-south-1" | "eu-north-1" | "me-south-1";

export enum PriceRegions{
  "us-west-2"= "US West (Oregon)",
  "us-west-1"= "US West (N. California)",
  "us-east-2"= "US East (Ohio)",
  "us-east-1"= "US East (N. Virginia)",
  "ap-south-1"= "Asia Pacific (Mumbai)",
  "ap-northeast-2"= "Asia Pacific (Seoul)",
  "ap-northeast-1"= "Asia Pacific (Tokyo)",
  "ap-southeast-1"= "Asia Pacific (Singapore)",
  "ap-southeast-2"= "Asia Pacific (Sydney)",
  "ca-central-1"= "Canada (Central)",
  "cn-north-1"= "China (Beijing)",
  "eu-central-1"= "EU (Frankfurt)",
  "eu-west-1"= "EU (Ireland)",
  "eu-west-2"= "EU (London)",
  "eu-west-3"= "EU (Paris)",
  "sa-east-1"= "South America (São Paulo)",
  "us-gov-west-1"= "AWS GovCloud (US)",
  "ap-east-1" = "Asia Pacific (Hong Kong)",
  "ap-southeast-3" = "Asia Pacific (Jakarta)",
  "ap-northeast-3" = "Asia Pacific (Osaka)",
  "eu-south-1" = "Europe (Milan)",
  "eu-north-1" = "Europe (Stockholm)",
  "me-south-1" = "Middle East (Bahrain)"
}
export interface RuleGroupSet {
  CustomRules?: Rule[],
  ManagedRuleGroups?: ManagedRuleGroup[];
}