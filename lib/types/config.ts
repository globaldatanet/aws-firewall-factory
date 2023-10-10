/* eslint-disable @typescript-eslint/naming-convention */
import { Rule, ManagedRuleGroup } from "./fms";
import { aws_fms as fms } from "aws-cdk-lib";
import { CfnTag } from "aws-cdk-lib";
import * as fwmEnums from "./enums";

export interface Config {
  readonly General: {
    readonly Prefix: string,
    readonly Stage: string,
    readonly LoggingConfiguration: "S3" | "Firehose"
    readonly FireHoseKeyArn?: string,
    readonly S3LoggingBucketName: string,
    readonly DeployHash?: string,
    readonly SecuredDomain: Array<string>,
    readonly CreateDashboard?: boolean,
  },
  readonly WebAcl:{
    readonly Name: string,
    
    /**
      * @TJS-pattern ^([\p{L}\p{Z}\p{N}_.:\/=+\-@]*)$
    */
    readonly Description?: string,
    readonly IncludeMap:  fms.CfnPolicy.IEMapProperty,
    readonly ExcludeMap?: fms.CfnPolicy.IEMapProperty,
    readonly Scope: fwmEnums.WebAclScope | "CLOUDFRONT" | "REGIONAL",
    readonly Type: fwmEnums.WebAclTypeEnum | "ResourceTypeList" | WebAclType,
    readonly TypeList?: fwmEnums.WebAclTypeEnum[] | WebAclType[],
    readonly ResourceTags?: Array<fms.CfnPolicy.ResourceTagProperty>,
    readonly ExcludeResourceTags?: boolean,
    readonly RemediationEnabled?: boolean,
    readonly ResourcesCleanUp?: boolean,
    readonly IPSets?: IPSet[],
    readonly RegexPatternSets?: RegexPatternSet[];
    readonly PreProcess: RuleGroupSet,
    readonly PostProcess: RuleGroupSet,
  },
}

export type WebAclType= "AWS::ElasticLoadBalancingV2::LoadBalancer" | "AWS::CloudFront::Distribution" | "AWS::ApiGatewayV2::Api" | "AWS::ApiGateway::Stage"
// | "AWS::Cognito::UserPool" | "AWS::AppSync::GraphQLApi" - waiting for support if you need a GraphQLApi Firewall just use an ApiGateway:Stage Firewall
export interface Prerequisites {
  readonly General: {
    readonly Prefix: string,
  },
  readonly Information?:{
    SlackWebhook?: string,
    TeamsWebhook?: string,
  }
  readonly Logging?: {
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

export type CustomResponseBodies = { [key:string]: {
  /**
    * @TJS-pattern [\s\S]*
  */
  Content: string,
  ContentType: fwmEnums.CustomResponseBodiesContentType,
}};

export interface RuleGroupSet {
  CustomResponseBodies?: CustomResponseBodies,
  CustomRules?: Rule[],
  ManagedRuleGroups?: ManagedRuleGroup[];
}

/**
  * @TJS-pattern (?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}\/(3[0-2]|[12]?[0-9])$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$)
*/
type IPAddress = string; // The regex above matches both IPv4 and IPv6 in CIDR notation, e.g. 123.4.3.0/32

interface IPAddressWithDescription {
  description: string,
  ip: IPAddress
}

export interface IPSet {
  /**
    * @TJS-pattern ^[a-zA-Z0-9]+$
  */
  name: string, // This name will be used as a CloudFormation logical ID, so it can't have a already used name and must be alphanumeric
  /*
    * @TJS-pattern ^[\w+=:#@\/\-,\.][\w+=:#@\/\-,\.\s]+[\w+=:#@\/\-,\.]$
  */
  description?: string,
  addresses: Array<IPAddressWithDescription | IPAddress>,
  ipAddressVersion: "IPV4" | "IPV6",
  tags?: CfnTag[]
}

export interface RegexPatternSet {
  /**
    * @TJS-pattern ^[a-zA-Z0-9]+$
  */
  name: string, // This name will be used as a CloudFormation logical ID, so it can't have a already used name and must be alphanumeric
  /*
    * @TJS-pattern ^[\w+=:#@\/\-,\.][\w+=:#@\/\-,\.\s]+[\w+=:#@\/\-,\.]$
  */
  description?: string,
  regularExpressionList: string[],
  tags?: CfnTag[]
}
export const NONEVERSIONEDMANAGEDRULEGRPOUP = ["AWSManagedRulesBotControlRuleSet","AWSManagedRulesATPRuleSet","AWSManagedRulesACFPRuleSet","AWSManagedRulesAmazonIpReputationList","AWSManagedRulesAnonymousIpList"];