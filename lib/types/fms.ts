/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

import { aws_wafv2 as waf } from "aws-cdk-lib";
import * as fwmEnums from "./enums";

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

export interface Action  {
  block?: CustomResponse,
  allow?: CustomRequestHandling,
  count?: CustomRequestHandling,
  captcha?: CustomRequestHandling,
  challenge?: CustomRequestHandling
}

export interface RuleActionOverrideProperty {
  name: string,
  actionToUse: Action
}

type NameObject = {
  /**
    * @TJS-pattern ^[0-9A-Za-z_\-:]+$
  */
  name: string
}
export interface ManagedRuleGroup {
  vendor: fwmEnums.ManagedRuleGroupVendor | string | "AWS",
  name: fwmEnums.AwsManagedRules | string,
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

export interface ManagedServiceData {
  type: string,
  defaultAction: {
    type: "ALLOW" | "DENY" | "COUNT" | "NONE"
  },
  preProcessRuleGroups: any,
  postProcessRuleGroups: any,
  overrideCustomerWebACLAssociation: boolean,
  loggingConfiguration: {
    logDestinationConfigs: string[]
  }
}

export interface ServiceDataManagedRuleGroup extends ServiceDataAbstactRuleGroup {
  managedRuleGroupIdentifier: {
    vendorName: string,
    managedRuleGroupName: string,
    version?: string | null,
    versionEnabled?: boolean
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  excludeRules: any,
  ruleGroupType: "ManagedRuleGroup",
  ruleActionOverrides: RuleActionOverrideProperty[] | undefined,
  awsManagedRulesBotControlRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesBotControlRuleSetProperty,
  awsManagedRulesACFPRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesACFPRuleSetProperty,
  awsManagedRulesATPRuleSetProperty?: waf.CfnWebACL.AWSManagedRulesATPRuleSetProperty,
}

export interface ServiceDataRuleGroup extends ServiceDataAbstactRuleGroup {
  ruleGroupType: "RuleGroup"
}

export interface ServiceDataAbstactRuleGroup {
  overrideAction: {
    type: "ALLOW" | "DENY" | "NONE" | "COUNT"
  },
  ruleGroupArn: string | null,
  ruleGroupType: string
}

export interface NotStatementProperty {
  statement: waf.CfnWebACL.StatementProperty;
}

export interface SubVariables {
  [key: string]: string;
}