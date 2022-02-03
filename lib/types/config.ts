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
    readonly Scope: string,
    readonly Type: string,
    readonly Rules: Array<RulesArray>,
    readonly ManagedRuleGroups: any[],
  },
}

interface RulesArray{
  Name?: string,
  Statement: any,
  Action: any,
  VisibilityConfig: any,
  CaptchaConfig?: any,
}