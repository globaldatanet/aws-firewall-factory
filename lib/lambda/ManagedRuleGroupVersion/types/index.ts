import {ManagedRuleGroupVersion} from "@aws-sdk/client-wafv2";
export interface ManagedRuleGroupVersionResponse {
    Version: string,
    State: "FAILED" | "SUCCESS",
    Description: string,
}


export interface PaginatedManagedRuleGroupVersions {
    Versions: ManagedRuleGroupVersion[],
    CurrentDefaultVersion: string,
    Error: string,
}

