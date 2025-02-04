import { WebAclScope, WebAclTypeEnum, CustomResponseBodiesContentType} from "../enums/index";
import { aws_fms as fms, CfnTag } from "aws-cdk-lib";

/**
 * Settings for the AWS WAF policy (type WAFV2) that specifies rule groups to run first in the corresponding AWS WAF Web ACL and rule groups to run last in the Web ACL.
 */
export interface WafConfig {
    readonly General: {
      /**
       * Defines a Prefix which will be added to all resources.
       */
      readonly Prefix: string;
      /**
       * Defines a Stage which will be added to all resources.
       */
      readonly Stage: string;
      /**
       * Defines the selected logging option for the WAF.
       */
      readonly LoggingConfiguration: "S3" | "Firehose";
      /**
       * Define KMS Key to be used for Kinesis Firehose.
       */
      readonly FireHoseKeyArn?: string;
      /**
       * Define Name of the S3 Bucket where the Firewall logs will be stored.
       */
      readonly S3LoggingBucketName: string;
      readonly DeployHash?: string;
      /**
       * Defines the domain(s) that can be checked to audit your WAF.
       */
      readonly SecuredDomain: Array<string>;
      /**
       * Defines whether to set up a dashboard for your firewall in the central security account. To use this feature, cross-account functionality must be enabled in CloudWatch.
       */
      readonly CreateDashboard?: boolean;
    };
  
    readonly WebAcl: {
      /**
       * Defines Name of your web application firewall.
       */
      readonly Name: string;
      /**
       * Defines Description of your web application firewall.
       */
      readonly Description?: string;
      /**
       * Specifies the AWS account IDs and AWS Organizations organizational units (OUs) to include from the policy.
       *
       * Specifying an OU is the equivalent of specifying all accounts in the OU and in any of its child OUs, including any child OUs and accounts that are added at a later time.
       *
       * This is used for the policy's `IncludeMap`.
       *
       * You can specify account IDs, OUs, or a combination:
       *
       * - Specify account IDs by setting the key to `ACCOUNT` . For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”]}` .
       * - Specify OUs by setting the key to `ORGUNIT` . For example, the following is a valid map: `{“ORGUNIT” : [“ouid111”, “ouid112”]}` .
       * - Specify accounts and OUs together in a single map, separated with a comma. For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”], “ORGUNIT” : [“ouid111”, “ouid112”]}` .
       *
       * @struct
       * @stability external
       * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-fms-policy-iemap.html
       */
      readonly IncludeMap: fms.CfnPolicy.IEMapProperty;
      /**
       * Specifies the AWS account IDs and AWS Organizations organizational units (OUs) to exclude from the policy.
       *
       * Specifying an OU is the equivalent of specifying all accounts in the OU and in any of its child OUs, including any child OUs and accounts that are added at a later time.
       *
       * This is used for the policy's `ExcludeMap`.
       *
       * You can specify account IDs, OUs, or a combination:
       *
       * - Specify account IDs by setting the key to `ACCOUNT` . For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”]}` .
       * - Specify OUs by setting the key to `ORGUNIT` . For example, the following is a valid map: `{“ORGUNIT” : [“ouid111”, “ouid112”]}` .
       * - Specify accounts and OUs together in a single map, separated with a comma. For example, the following is a valid map: `{“ACCOUNT” : [“accountID1”, “accountID2”], “ORGUNIT” : [“ouid111”, “ouid112”]}` .
       *
       * @struct
       * @stability external
       * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-fms-policy-iemap.html
       */
      readonly ExcludeMap?: fms.CfnPolicy.IEMapProperty;
      /**
       * Replace web ACLs that are currently associated with in-scope resources with the web ACLs created by this policy - Default is False
       */
      readonly OverrideCustomerWebACLAssociation?: boolean;

      /**
       * Automatically remove protections from resources that leave the policy scope and clean up resources that 
       * Firewall Manager is managing for accounts when those accounts leave policy scope - Default is False
       */
      readonly OptimizeUnassociatedWebACL?: boolean;

      /**
       * Specifies whether this is for an Amazon CloudFront distribution or for a regional application.
       * A regional application can be
       * - an Application Load Balancer (ALB),
       * - an Amazon API Gateway REST API,
       * - an AWS AppSync GraphQL API,
       * - an Amazon Cognito user pool,
       * - an AWS App Runner service,
       * - or an AWS Verified Access instance.
       *
       * Valid Values are CLOUDFRONT and REGIONAL.
       *
       * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
       */
      readonly Scope: WebAclScope | "CLOUDFRONT" | "REGIONAL";
      /**
       * The type of resource protected by or in scope of the policy. To apply this policy to multiple resource types, specify a resource type of ResourceTypeList and then specify the resource types in a ResourceTypeList.
       */
      readonly Type: WebAclTypeEnum | "ResourceTypeList" | WebAclType;
      /**
       * enum for supportd webacl types
       */
      readonly TypeList?: WebAclTypeEnum[] | WebAclType[];
      /**
       * An array of ResourceTag objects, used to explicitly include resources in the policy scope or explicitly exclude them. If this isn't set, then tags aren't used to modify policy scope. See also ExcludeResourceTags.
       */
      readonly ResourceTags?: Array<fms.CfnPolicy.ResourceTagProperty>;
      /**
       * Used only when tags are specified in the ResourceTags property. If this property is True, resources with the specified tags are not in scope of the policy. If it's False, only resources with the specified tags are in scope of the policy.
       */
      readonly ExcludeResourceTags?: boolean;
      /**
       * Indicates if the policy should be automatically applied to new resources.
       */
      readonly RemediationEnabled?: boolean;
      /**
       * Indicates whether AWS Firewall Manager should automatically remove protections from resources that leave the policy scope and clean up resources that Firewall Manager is managing for accounts when those accounts leave policy scope. For example, Firewall Manager will disassociate a Firewall Manager managed web ACL from a protected customer resource when the customer resource leaves policy scope.
       */
      readonly ResourcesCleanUp?: boolean;
      /**
       * Contains one or more IP addresses or blocks of IP addresses specified in Classless Inter-Domain Routing (CIDR) notation. AWS WAF supports IPv4 address ranges: /8 and any range between /16 through /32. AWS WAF supports IPv6 address ranges: /24, /32, /48, /56, /64, and /128.
       */
      readonly IPSets?: IPSet[];
      /**
       * The RegexPatternSet specifies the regular expression (regex) pattern that you want AWS WAF to search for, such as B[a@]dB[o0]t. You can then configure AWS WAF to reject those requests.
       */
      readonly RegexPatternSets?: RegexPatternSet[];
      /**
       * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
       */
      readonly PreProcess: RuleGroupSet;
      /**
       * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
       */
      readonly PostProcess: RuleGroupSet;
    };
  }

/**
 * The type of resource protected by or in scope of the policy. To apply this policy to multiple resource types, specify a resource type of ResourceTypeList and then specify the resource types in a ResourceTypeList.
 */
export type WebAclType =
| "AWS::ElasticLoadBalancingV2::LoadBalancer"
| "AWS::CloudFront::Distribution"
| "AWS::ApiGatewayV2::Api"
| "AWS::ApiGateway::Stage";
// | "AWS::Cognito::UserPool" | "AWS::AppSync::GraphQLApi" - waiting for support if you need a GraphQLApi Firewall just use an ApiGateway:Stage Firewall

/**
 * A custom response to send to the client. You can define a custom response for rule actions and default web ACL actions that are set to the block action.
 */
export type CustomResponseBodies = {
    [key: string]: {
      /**
       * @TJS-pattern [\s\S]*
       */
      content: string;
      /**
       * AWS WAF Content Type
       *
       * The type of content in the payload that you are defining in the Content string.
       *
       * @see https://docs.aws.amazon.com/waf/latest/APIReference/API_CustomResponseBody.html
       */
      contentType: CustomResponseBodiesContentType;
    };
  };
  
/**
   * Defines a Set of Custom Rules and AWS ManagedRulesGroups.
   */
export interface RuleGroupSet {
    CustomResponseBodies?: CustomResponseBodies;
    CustomRules?: Rule[];
    ManagedRuleGroups?: ManagedRuleGroup[];
  }
  
/**
   * The regex above matches both IPv4 and IPv6 in CIDR notation, e.g. 123.4.3.0/32
   * @TJS-pattern (?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}\/(3[0-2]|[12]?[0-9])$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$)
   */
export type IPAddress = string;
  
export interface IPAddressWithDescription {
    description: string;
    /**
     * Defines a Ip Address - IPv4 and IPv6 in CIDR notation, e.g. 123.4.3.0/32
     */
    ip: IPAddress;
  }
  
/**
   * Contains one or more IP addresses or blocks of IP addresses specified in Classless Inter-Domain Routing (CIDR) notation. AWS WAF supports IPv4 address ranges: /8 and any range between /16 through /32. AWS WAF supports IPv6 address ranges: /24, /32, /48, /56, /64, and /128.
   */
export interface IPSet {
    /**
     * @TJS-pattern ^[a-zA-Z0-9]+$
     */
    name: string; // This name will be used as a CloudFormation logical ID, so it can't have a already used name and must be alphanumeric
    /*
     * @TJS-pattern ^[a-zA-Z0-9=:#@/\-,.][a-zA-Z0-9+=:#@/\-,.\s]+[a-zA-Z0-9+=:#@/\-,.]{1,256}$
     */
    description?: string;
    /**
     * Defines an Array of Ip Address - IPv4 and IPv6 in CIDR notation, e.g. 123.4.3.0/32 or IpAddress with Description
     */
    addresses: Array<IPAddressWithDescription | IPAddress>;
    /**
     * Defines the IP address version of the set. Valid Values are IPV4 and IPV6.
     */
    ipAddressVersion: "IPV4" | "IPV6";
    /**
     * Defines Array of Tags to be added to the IPSet
     * More info: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-resource-tags.html
     */
    tags?: CfnTag[];
  }
  
/**
   * The RegexPatternSet specifies the regular expression (regex) pattern that you want AWS WAF to search for, such as B[a@]dB[o0]t. You can then configure AWS WAF to reject those requests.
   */
export interface RegexPatternSet {
    /**
     * @TJS-pattern ^[a-zA-Z0-9]+$
     */
    name: string; // This name will be used as a CloudFormation logical ID, so it can't have a already used name and must be alphanumeric
    /*
     * @TJS-pattern ^[\w+=:#@\/\-,\.][\w+=:#@\/\-,\.\s]+[\w+=:#@\/\-,\.]$
     */
    description?: string;
    /**
     * Defines an Array of Regular Expressions
     */
    regularExpressionList: string[];
    /**
     * Defines Array of Tags to be added to the RegexPatternSet
     * More info: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-resource-tags.html
     */
    tags?: CfnTag[];
  }
  
/**
   * Represents all AWS ManagedRuleGroups which are not versioned
   */
export const NONEVERSIONEDMANAGEDRULEGRPOUP = [
  "AWSManagedRulesBotControlRuleSet",
  "AWSManagedRulesATPRuleSet",
  "AWSManagedRulesACFPRuleSet",
  "AWSManagedRulesAmazonIpReputationList",
  "AWSManagedRulesAnonymousIpList",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
import { aws_wafv2 as waf } from "aws-cdk-lib";
/*
  * Interface for the CustomRequestHandling
  */
export interface CustomRequestHandling {
  customRequestHandling?: {
    insertHeaders: {
      /**
        * @TJS-pattern ^[a-zA-Z0-9._$-]+$
      */
      name: string,
      /**
        * @TJS-pattern .*
      */
      value: string,
    }[],
  }
}

/**
 * Interface for the CustomResponse
 */
export interface CustomResponse {
  customResponse?: {
    responseCode: number,

    /**
      * @TJS-pattern ^[\w\-]+$
    */
    customResponseBodyKey?: string,
    responseHeaders?: {
      /**
        * @TJS-pattern ^[a-zA-Z0-9._$-]+$
      */
      name: string,
      /**
        * @TJS-pattern .*
      */
      value: string,
    }[],
  }
}

/**
 * Interce for the WAF Action
 */
export interface Action  {
  block?: CustomResponse,
  allow?: CustomRequestHandling,
  count?: CustomRequestHandling,
  captcha?: CustomRequestHandling,
  challenge?: CustomRequestHandling
}

/**
 * Interface for the RuleActionOverrideProperty
 */
export interface RuleActionOverrideProperty {
  name: string,
  actionToUse: Action
}

/**
 * Type for the NameObject
 */
type NameObject = {
  /**
    * @TJS-pattern ^[0-9A-Za-z_\-:]+$
  */
  name: string
}

/**
 * Interface for the ManagedRuleGroup
 */
export interface ManagedRuleGroup extends waf.CfnWebACL.ManagedRuleGroupStatementProperty {
  version?: string,
  /**
    * Will be automatically set using the [Check Capacity API](https://docs.aws.amazon.com/waf/latest/APIReference/API_CheckCapacity.html).
  */
  capacity?: number,
  excludeRules?: NameObject[],
  overrideAction?: {
    type: "COUNT" | "NONE"
  },
  ruleActionOverrides?: RuleActionOverrideProperty[],
  versionEnabled?: boolean
  /**
   * Details for your use of the Bot Control managed rule group, AWSManagedRulesBotControlRuleSet . See also: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesbotcontrolruleset.html
   */
  awsManagedRulesBotControlRuleSetProperty?: { inspectionLevel: "COMMON" | "TARGETED", enableMachineLearning: boolean},
  /**
   * Details for your use of the account creation fraud prevention managed rule group, AWSManagedRulesACFPRuleSet. See also: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesacfpruleset.html
   */
  awsManagedRulesACFPRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesACFPRuleSetProperty,
  /**
   * Details for your use of the account takeover prevention managed rule group, AWSManagedRulesATPRuleSet. See also: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesatpruleset.html
   */
  awsManagedRulesATPRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesATPRuleSetProperty,
  /**
    * Enforce the [current Default version](https://docs.aws.amazon.com/waf/latest/developerguide/waf-managed-rule-groups-versioning.html) of the managed rule group to be retrieved using a Lambda Function.
  */
  latestVersion?: boolean
  enforceUpdate?:boolean
}

/**
 * Interface for the Rule
 */
export interface Rule {
  name: string,
  statement: waf.CfnWebACL.StatementProperty,
  action: waf.CfnWebACL.RuleActionProperty,
  visibilityConfig: waf.CfnWebACL.VisibilityConfigProperty,
  captchaConfig?: waf.CfnWebACL.CaptchaConfigProperty,
  ruleLabels?: waf.CfnWebACL.LabelProperty[],
  /**
    * Each rule in a web ACL and each rule in a rule group must have a unique priority setting to ensure proper rule execution. [More information about processing order of rules and rule groups in a web ACL](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-processing-order.html)
  */
  priority: number,
}

/**
 * Interface for the ManagedServiceData
 */
export interface ManagedServiceData {
  type: string,
  defaultAction: {
    type: "ALLOW" | "DENY" | "COUNT" | "NONE"
  },
  preProcessRuleGroups: any,
  postProcessRuleGroups: any,
  overrideCustomerWebACLAssociation: boolean,
  optimizeUnassociatedWebACL?: boolean,
  loggingConfiguration: {
    logDestinationConfigs: string[]
  }
}

/**
 * Interface for the ServiceDataManagedRuleGroup
 */
export interface ServiceDataManagedRuleGroup extends ServiceDataAbstactRuleGroup {
  managedRuleGroupIdentifier: {
    vendorName: string,
    managedRuleGroupName: string,
    version?: string | null,
    versionEnabled?: boolean
  },
   
  excludeRules: any,
  ruleGroupType: "ManagedRuleGroup",
  ruleActionOverrides: RuleActionOverrideProperty[] | undefined,
  awsManagedRulesBotControlRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesBotControlRuleSetProperty,
  awsManagedRulesACFPRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesACFPRuleSetProperty,
  awsManagedRulesATPRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesATPRuleSetProperty,
}

/**
 * Interface for the ServiceDataRuleGroup
 */
export interface ServiceDataRuleGroup extends ServiceDataAbstactRuleGroup {
  ruleGroupType: "RuleGroup"
}

/**
 * Interface for the ServiceDataAbstactRuleGroup
 */
export interface ServiceDataAbstactRuleGroup {
  overrideAction: {
    type: "ALLOW" | "DENY" | "NONE" | "COUNT"
  },
  ruleGroupArn?: string,
  ruleGroupType: string
}

/**
 * Interface for the NotStatementProperty
 */
export interface NotStatementProperty {
  statement: waf.CfnWebACL.StatementProperty;
}

/**
 * Interface for the SubVariables
 */
export interface SubVariables {
  [key: string]: string;
}
