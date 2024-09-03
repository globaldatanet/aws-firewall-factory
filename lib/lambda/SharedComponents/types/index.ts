import {ManagedRuleGroupVersion} from "@aws-sdk/client-wafv2";
import { Scope } from "@aws-sdk/client-wafv2";
export interface PaginatedManagedRuleGroupVersions {
    Versions: ManagedRuleGroupVersion[],
    CurrentDefaultVersion: string,
    Error: string,
}


export interface AccountWebAcls {
    AccountAlias: string,
    AccountId: string,
    WebACLsPerAccount: { [index: string]: WebAclsPerRegion },
    WafsInUse: number,
    TotalWafs: number,
    IgnoredWafs: number,
}


export interface WebAclsPerRegion {
    WebACLsInUse: WebAcls[]
    UnusedWebACLs: WebAcls[]
    IgnoredWebACLs: WebAcls[]
}

export interface WebAcls {
    Name: string,
    Arn: string,
    Scope: Scope,
}

export interface FmsPolicy {
    Name: string,
    Scope: Scope,
}


export interface UnutilizedFirewalls {
    AccountWebACLs: AccountWebAcls[],
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
