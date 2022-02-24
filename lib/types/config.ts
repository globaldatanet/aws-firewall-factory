export interface Config {
  readonly General: {
    readonly Prefix: string,
    readonly Stage: string,
    readonly DeployTo: string[],
    readonly FireHoseKeyArn: string,
    readonly S3LoggingBucketName: string,
    DeployHash: string,
    readonly SecuredDomain: string,
  },
  readonly WebAcl:{
    readonly Name: string,
    readonly Scope: "CLOUDFRONT" | "REGIONAL",
    readonly Type: string,
    readonly PreProcess: RouleGroupSet,
    readonly PostProcess: RouleGroupSet
  },
}

interface RouleGroupSet {
  CustomRules?: Rule[],
  ManagedRuleGroups?: ManagedRuleGroup[];
}

interface ManagedRuleGroup {
  Vendor: string,
  Name: string,
  Version: string,
  Capacity: number,
  ExcludeRules?: NameObject[],
  OverrideAction?: {
    type: "COUNT" | "NONE"
  }
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

type NameObject = {
  Name: string
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