/* eslint-disable @typescript-eslint/ban-types */
interface CustomRequestHandling {
  CustomRequestHandling?: {
    InsertHeaders: {
      Name: string,
      Value: string,
    }[],
  }
}

interface CustomResponse {
  CustomResponse?: {
    ResponseCode: number,

    CustomResponseBodyKey?: string,
    ResponseHeaders?: {
      Name: string,
      Value: string,
    }[],
  }
}

interface Action  {
  Block?: CustomResponse,
  Allow?: CustomRequestHandling,
  Count?: CustomRequestHandling,
  Captcha?: CustomRequestHandling,
  Challenge?: CustomRequestHandling
}

interface RuleActionOverrideProperty {
  Name: string, 
  ActionToUse: Action
}

type NameObject = {
  /**
    * @TJS-pattern ^[0-9A-Za-z_\-:]+$
  */
  Name: string
}
export interface ManagedRuleGroup {
  Vendor: string,
  Name: string,
  Version: string,
  Capacity: number,
  ExcludeRules?: NameObject[],
  OverrideAction?: {
    type: "COUNT" | "NONE"
  },
  RuleActionOverrides?: RuleActionOverrideProperty[]
}

export interface Rule {
  Name?: string,
  Statement: any,
  Action: Action,
  VisibilityConfig: {
    SampledRequestsEnabled: boolean,
    CloudWatchMetricsEnabled: boolean,
    MetricName?: string
  },
  CaptchaConfig?: {
    ImmunityTimeProperty?: {
      ImmunityTime: number
    }
  },
  RuleLabels?: NameObject[]
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
    version: string | null,
    versionEnabled?: boolean
  },
  excludeRules: any,
  ruleGroupType: "ManagedRuleGroup",
  ruleActionOverrides: RuleActionOverrideProperty[] | undefined,
}

export interface ServiceDataRuleGroup extends ServiceDataAbstactRuleGroup {
  ruleGroupType: "RuleGroup"
}

interface ServiceDataAbstactRuleGroup {
  overrideAction: {
    type: "ALLOW" | "DENY" | "NONE" | "COUNT"
  },
  ruleGroupArn: string | null,
  ruleGroupType: string
}