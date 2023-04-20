/* eslint-disable @typescript-eslint/ban-types */
type RuleActionOverrideProperty = { Name: string, ActionToUse: { Count: {} }}
export interface ManagedRuleGroup {
  Vendor: string,
  Name: string,
  Version: string,
  Capacity: number,
  ExcludeRules?: NameObject[],
  OverrideAction?: {
    type: "COUNT" | "NONE"
  },
  RuleActionOverrides?: RuleActionOverrideProperty[] | undefined
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

type NameObject = {
  Name: string
}

export interface ServiceDataManagedRuleGroup extends ServiceDataAbstactRuleGroup {
  managedRuleGroupIdentifier: {
    vendorName: string,
    managedRuleGroupName: string,
    version: string | null,
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

type Action = | {
  Block: Record<string, never>
}
| {
  Allow: Record<string, never>
}
| {
  Count: Record<string, never>
}
| {
  Captcha: Record<string, never>
}