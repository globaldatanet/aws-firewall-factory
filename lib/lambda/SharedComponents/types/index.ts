import {ManagedRuleGroupVersion} from "@aws-sdk/client-wafv2";

export interface PaginatedManagedRuleGroupVersions {
    Versions: ManagedRuleGroupVersion[],
    CurrentDefaultVersion: string,
    Error: string,
}

