export interface ManagedRuleGroupVersionResponse {
    Version: string,
    State: "FAILED" | "SUCCESS",
    Description: string,
}