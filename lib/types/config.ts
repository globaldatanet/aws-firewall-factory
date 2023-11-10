/* eslint-disable @typescript-eslint/naming-convention */
import { Rule, ManagedRuleGroup } from "./fms";
import { aws_fms as fms } from "aws-cdk-lib";
import { CfnTag } from "aws-cdk-lib";
import * as fwmEnums from "./enums";

/**
 * Settings for the AWS WAF policy (type WAFV2) that specifies rule groups to run first in the corresponding AWS WAF Web ACL and rule groups to run last in the Web ACL.
 */
export interface Config {
  readonly General: {
    readonly Prefix: string,
    readonly Stage: string,
    /**
     * Defines the selected logging option for the WAF.
     */
    readonly LoggingConfiguration: "S3" | "Firehose"
    readonly FireHoseKeyArn?: string,
    readonly S3LoggingBucketName: string,
    readonly DeployHash?: string,
    /**
     * Defines the domain(s) that can be checked to audit your WAF.
     */
    readonly SecuredDomain: Array<string>,
    /**
     * Defines whether to set up a dashboard for your firewall in the central security account. To use this feature, cross-account functionality must be enabled in CloudWatch.
     */
    readonly CreateDashboard?: boolean,
  },
  readonly WebAcl?:{
    readonly Name: string,
    readonly Description?: string,
    readonly IncludeMap:  fms.CfnPolicy.IEMapProperty,
    readonly ExcludeMap?: fms.CfnPolicy.IEMapProperty,
    readonly Scope: fwmEnums.WebAclScope | "CLOUDFRONT" | "REGIONAL",
    /**
     * The type of resource protected by or in scope of the policy. To apply this policy to multiple resource types, specify a resource type of ResourceTypeList and then specify the resource types in a ResourceTypeList.
     */
    readonly Type: fwmEnums.WebAclTypeEnum | "ResourceTypeList" | WebAclType,
    readonly TypeList?: fwmEnums.WebAclTypeEnum[] | WebAclType[],
    /**
     * An array of ResourceTag objects, used to explicitly include resources in the policy scope or explicitly exclude them. If this isn't set, then tags aren't used to modify policy scope. See also ExcludeResourceTags.
     */
    readonly ResourceTags?: Array<fms.CfnPolicy.ResourceTagProperty>,
    /**
     * Used only when tags are specified in the ResourceTags property. If this property is True, resources with the specified tags are not in scope of the policy. If it's False, only resources with the specified tags are in scope of the policy.
     */
    readonly ExcludeResourceTags?: boolean,
    /**
     * Indicates if the policy should be automatically applied to new resources.
     */
    readonly RemediationEnabled?: boolean,
    /**
     * Indicates whether AWS Firewall Manager should automatically remove protections from resources that leave the policy scope and clean up resources that Firewall Manager is managing for accounts when those accounts leave policy scope. For example, Firewall Manager will disassociate a Firewall Manager managed web ACL from a protected customer resource when the customer resource leaves policy scope.
     */
    readonly ResourcesCleanUp?: boolean,
    /**
     * Contains one or more IP addresses or blocks of IP addresses specified in Classless Inter-Domain Routing (CIDR) notation. AWS WAF supports IPv4 address ranges: /8 and any range between /16 through /32. AWS WAF supports IPv6 address ranges: /24, /32, /48, /56, /64, and /128.
     */
    readonly IPSets?: IPSet[],
    /**
     * The RegexPatternSet specifies the regular expression (regex) pattern that you want AWS WAF to search for, such as B[a@]dB[o0]t. You can then configure AWS WAF to reject those requests.
    */
    readonly RegexPatternSets?: RegexPatternSet[];
    /**
     * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
     */
    readonly PreProcess: RuleGroupSet,
    /**
     * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
     */
    readonly PostProcess: RuleGroupSet,
  },
  readonly NetworkFirewall?:{
    readonly Name: string,
    readonly Description?: string,
    readonly IncludeMap:  fms.CfnPolicy.IEMapProperty,
    readonly ExcludeMap?: fms.CfnPolicy.IEMapProperty,
    readonly Type: fwmEnums.NetworkFirewallTypeEnum | NetworkFirewallType,
    /**
     * An array of ResourceTag objects, used to explicitly include resources in the policy scope or explicitly exclude them. If this isn't set, then tags aren't used to modify policy scope. See also ExcludeResourceTags.
     */
    readonly ResourceTags?: Array<fms.CfnPolicy.ResourceTagProperty>,
    /**
     * Used only when tags are specified in the ResourceTags property. If this property is True, resources with the specified tags are not in scope of the policy. If it's False, only resources with the specified tags are in scope of the policy.
     */
    readonly ExcludeResourceTags?: boolean,
    /**
     * Indicates if the policy should be automatically applied to new resources.
     */
    readonly RemediationEnabled?: boolean,
    /**
     * Indicates whether AWS Firewall Manager should automatically remove protections from resources that leave the policy scope and clean up resources that Firewall Manager is managing for accounts when those accounts leave policy scope. For example, Firewall Manager will disassociate a Firewall Manager managed web ACL from a protected customer resource when the customer resource leaves policy scope.
     */
    readonly ResourcesCleanUp?: boolean,
    /**
     * Contains one or more IP addresses or blocks of IP addresses specified in Classless Inter-Domain Routing (CIDR) notation. AWS WAF supports IPv4 address ranges: /8 and any range between /16 through /32. AWS WAF supports IPv6 address ranges: /24, /32, /48, /56, /64, and /128.
     */
  }
}

/**
 * The type of resource protected by or in scope of the policy. To apply this policy to multiple resource types, specify a resource type of ResourceTypeList and then specify the resource types in a ResourceTypeList.
 */
export type WebAclType= "AWS::ElasticLoadBalancingV2::LoadBalancer" | "AWS::CloudFront::Distribution" | "AWS::ApiGatewayV2::Api" | "AWS::ApiGateway::Stage"

/**
 * The type of resource protected by or in scope of the policy.
 */
export type NetworkFirewallType= "AWS::EC2::VPC"

// | "AWS::Cognito::UserPool" | "AWS::AppSync::GraphQLApi" - waiting for support if you need a GraphQLApi Firewall just use an ApiGateway:Stage Firewall
export interface Prerequisites {
  readonly General: {
    readonly Prefix: string,
  },
  /**
    * Will add a Lambda function to the prerequisite stack that sends notifications when new versions and updates to a AWS ManagedRuleGroup appear in messengers (Slack/Teams).
  */
  readonly Information?:{
    SlackWebhook?: string,
    TeamsWebhook?: string,
  }
  /**
    * Will add a Lambda function to prerequisite Stack that send notifications about potential DDoS activity for protected resources to messengers (Slack/Teams)
    * This feature, coupled with [AWS Shield Advanced](https://aws.amazon.com/shield/).
  */
  readonly DdosNotifications?:{
    SlackWebhook?: string,
    TeamsWebhook?: string,
  }
  readonly Logging?: {
      readonly BucketProperties?: {
        /**
         * A name for the bucket. Allowed Pattern: ^[a-z0-9][a-z0-9//.//-]*[a-z0-9]$
         */
        readonly BucketName?: string,
        /**
         * Define if a KMS Key for the bucket will be created.
         */
        readonly KmsEncryptionKey: boolean,
        /**
        * Will add Object Lock (write-once-read-many (WORM)) to the S3 Bucket (Object Lock can help prevent objects from being deleted or overwritten for a fixed amount of time or indefinitely.)
      */
        readonly ObjectLock?: {
          readonly Days: number,
          readonly Mode: "GOVERNANCE" | "COMPLIANCE"
        }

      },
      /**
       * Define if a KMS Key for Kinesis FireHose will be created.
       */
      readonly FireHoseKey?: {
        /**
         * Define if a Alias for the KMS Key
         */
        readonly KeyAlias: string
      },
      /**
       * Defines access to a central security account. Please specify a account ID such as 123456789012.This is necessary if you want to use a different account for all your firewalls.
       */
      readonly CrossAccountIdforPermissions?: string,
  }
}
/**
 * S3 Object Lock provides two retention modes:
    - Governance mode
    - Compliance mode
 */
export enum ObjectLockMode {
  GOVERNANCE = "GOVERNANCE",
  COMPLIANCE = "COMPLIANCE"
}

/**
 * Represents all AWS Regions
 */
export type RegionString = "us-west-2" | "us-west-1" | "us-east-2" | "us-east-1" | "ap-south-1"| "ap-northeast-2" | "ap-northeast-1" | "ap-southeast-1" | "ap-southeast-2" | "ca-central-1" | "cn-north-1" | "eu-central-1" | "eu-west-1" | "eu-west-2" | "eu-west-3" | "sa-east-1" | "us-gov-west-1" | "ap-east-1" | "ap-southeast-3" | "ap-northeast-3" | "eu-south-1" | "eu-north-1" | "me-south-1";

/**
 * Represents Region Codes for all AWS Regions
 */
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

/**
 * A custom response to send to the client. You can define a custom response for rule actions and default web ACL actions that are set to the block action.
*/
export type CustomResponseBodies = { [key:string]: {
  /**
    * @TJS-pattern [\s\S]*
  */
  Content: string,
  ContentType: fwmEnums.CustomResponseBodiesContentType,
}};

/**
 * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
 */
export interface RuleGroupSet {
  CustomResponseBodies?: CustomResponseBodies,
  CustomRules?: Rule[],
  ManagedRuleGroups?: ManagedRuleGroup[];
}

/**
  * The regex above matches both IPv4 and IPv6 in CIDR notation, e.g. 123.4.3.0/32
  * @TJS-pattern (?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}\/(3[0-2]|[12]?[0-9])$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$)
*/
export type IPAddress = string;

export interface IPAddressWithDescription {
  description: string,
  /**
    * Defines a Ip Address - IPv4 and IPv6 in CIDR notation, e.g. 123.4.3.0/32
   */
  ip: IPAddress
}

/**
 * Contains one or more IP addresses or blocks of IP addresses specified in Classless Inter-Domain Routing (CIDR) notation. AWS WAF supports IPv4 address ranges: /8 and any range between /16 through /32. AWS WAF supports IPv6 address ranges: /24, /32, /48, /56, /64, and /128.
 */
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

/**
 * The RegexPatternSet specifies the regular expression (regex) pattern that you want AWS WAF to search for, such as B[a@]dB[o0]t. You can then configure AWS WAF to reject those requests.
*/
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

/**
 * Represents all AWS ManagedRuleGroups which are not versioned
 */
export const NONEVERSIONEDMANAGEDRULEGRPOUP = ["AWSManagedRulesBotControlRuleSet","AWSManagedRulesATPRuleSet","AWSManagedRulesACFPRuleSet","AWSManagedRulesAmazonIpReputationList","AWSManagedRulesAnonymousIpList"];