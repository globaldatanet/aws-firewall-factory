import {ManagedRuleGroupVersion} from "@aws-sdk/client-wafv2";
import { Scope } from "@aws-sdk/client-wafv2";
export interface PaginatedManagedRuleGroupVersions {
    Versions: ManagedRuleGroupVersion[],
    CurrentDefaultVersion: string,
    Error: string,
}


export interface AccountWebACLs {
    AccountAlias: string,
    AccountId: string,
    WebACLsPerAccount: { [index: string]: WebACLsPerRegion },
    WafsInUse: number,
    TotalWafs: number,
    IgnoredWafs: number,
}


export interface WebACLsPerRegion {
    WebACLsInUse: WebACLs[]
    UnusedWebACLs: WebACLs[]
    IgnoredWebACLs: WebACLs[]
}

export interface WebACLs {
    Name: string,
    Arn: string,
    Scope: Scope,
}

export interface FmsPolicy {
    Name: string,
    Scope: Scope,
}


export interface UnutilizedFirewalls {
    AccountWebACLs: AccountWebACLs[],
    UnutilizedFMSPolicies: FmsPolicy[]
}

export interface ManagedRuleGroupVersionResponse {
    Version: string,
    State: "FAILED" | "SUCCESS",
    Description: string,
}

export interface WebHookSecretDefinition {
   WebhookUrl:string
   Messenger: "Slack" | "Teams",
}
