# Change Log

## Released

## 1.0.0

### Added

1. Automated Capactiy Calculation via [API - CheckCapacity](https://docs.aws.amazon.com/waf/latest/APIReference/API_CheckCapacity.html)
2. Algorithm to split Rules into RuleGroups
3. Automated Update of RuleGroup if Capacity Changed 
3. Add [ManagedRuleGroups](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html) via configuration file
4. Automated Generation of draw.io [diagram](https://app.diagrams.net/) for each WAF
5. Checking of the softlimit quota for WCU set in the AWS Account (Stop deployment if Caluclated WCU is above the quota)
6. Easy configuration of WAF Rules trough json file.
7. Deployment Hash to deploy same WAF more than one time for testing and/or blue/green deployments.
8. Stopping deployment if soft limit will be exceeded:  **Firewall Manager policies per organization per Region (L-0B28E140)** - **Maximum number of web ACL capacity units in a web ACL in WAF for regional (L-D9F31E8A)**
9. NEW **RegexMatchStatement** and **IPSetReferenceStatement** is working now 🚀



