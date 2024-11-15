/*
    * Interface for the runtime properties
    */
export interface RuntimeProps {
    GuidanceSummary: string[],
    Guidance: Guidance,
    PreProcess: ProcessProperties,
    PostProcess: ProcessProperties,
    ManagedRuleCapacity: number,
    Pricing: ResourcePrices,
    AllAwsRegions: string[],
}

/**
 * Interface for all the guidance information
 */
export interface Guidance {
    rateBasedStatementCount: number,
    nestedRateStatementCount: number,
    nestedRateStatementInfo: string[],
    overrideActionManagedRuleGroupCount: number,
    overrideActionManagedRuleGroupInfo: string[],
    byteMatchStatementPositionalConstraintCount: number,
    byteMatchStatementPositionalConstraintInfo: string[],
    noRuleLabelsCount: number,
    noRuleLabelsInfo: string[],
}

/**
 * Interface for the current AWS pricing information
 */
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
    Dashboard: number
}

/**
 * Interface for the process properties
 */
export interface ProcessProperties {
    Capacity: number,
    RuleCapacities: number[],
    DeployedRuleGroupCapacities: number[],
    DeployedRuleGroupNames: string[],
    DeployedRuleGroupIdentifier: string[],
    ManagedRuleGroupCount: number,
    ManagedRuleBotControlCount: number,
    ManagedRuleATPCount: number,
    IpReputationListCount: number,
    CustomRuleCount: number,
    CustomRuleGroupCount: number,
    CustomCaptchaRuleCount: number

}
