import { Rule, ManagedRuleGroup } from "./fms";
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
    readonly PreProcess: RuleGroupSet,
    readonly PostProcess: RuleGroupSet
  },
}

export interface RuleGroupSet {
  CustomRules?: Rule[],
  ManagedRuleGroups?: ManagedRuleGroup[];
}