export interface RuntimeProperties {
    PreProcessCapacity: number,
    PostProcessCapacity: number,
    ManagedRuleCapacity: number,
    PreProcessRuleCapacities: number[],
    PostProcessRuleCapacities: number[],
    PreProcessDeployedRuleGroupCapacities: number[],
    PreProcessDeployedRuleGroupNames: string[],
    PreProcessDeployedRuleGroupIdentifier: string[],
    PostProcessDeployedRuleGroupCapacities: number[],
    PostProcessDeployedRuleGroupNames: string[],
    PostProcessDeployedRuleGroupIdentifier: string[],
}