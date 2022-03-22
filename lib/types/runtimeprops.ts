export interface RuntimeProperties {
    PreProcess: ProcessProperties,
    PostProcess: ProcessProperties,
    ManagedRuleCapacity: number,
    Pricing: ResourcePrices,
}
export interface ResourcePrices {
    Policy: number,
    Rule: number,
    WebACL: number,
    Request: number,
    BotControl: number,
    BotControlRequest: number,
    Captcha: number,
    AccountTakeoverPrevention: number,
    AccountTakeoverPreventionRequest: number,
}

export interface ProcessProperties {
    Capacity: number,
    RuleCapacities: number[],
    DeployedRuleGroupCapacities: number[],
    DeployedRuleGroupNames: string[],
    DeployedRuleGroupIdentifier: string[],
    ManagedRuleGroupCount: number,
    ManagedRuleBotControlCount: number,
    ManagedRuleATPCount: number,
    CustomRuleCount: number,
    CustomRuleGroupCount: number,
    CustomCaptchaRuleCount: number

}