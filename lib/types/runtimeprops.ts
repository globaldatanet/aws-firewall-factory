export interface RuntimeProperties {
    PreProcess: ProcessProperties,
    PostProcess: ProcessProperties,
    ManagedRuleCapacity: number
}

export interface ProcessProperties {
    Capacity: number,
    RuleCapacities: number[],
    DeployedRuleGroupCapacities: number[],
    DeployedRuleGroupNames: string[],
    DeployedRuleGroupIdentifier: string[]
}