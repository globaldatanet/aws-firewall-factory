# Change Log

## Released

## 3.2.6
### Add
- Linting Github Action for typescript 18 & 20
### Fixed
- Bump @aws-sdk/client-cloudformation from 3.321.1 to 3.353.0
- Bump @aws-sdk/client-cloudwatch 3.341.0 to 3.353.0
- Bump @aws-sdk/client-fms 3.342.0 to 3.353.0
- Bump @aws-sdk/client-pricing 3.341 .0 to 3.353.0
- Bump @aws-sdk/client-service-quotas 3.342.0 to 3.353.0
- Bump @aws-sdk/client-wafv2  from 3.321.1 to 3.353.0
- Bump @mhlabs/cfn-diagram from 1.1.32 to 1.1.36
- Add more Linting rules see ./eslintrc

## 3.2.5
### Fixed
- Pricing Calculation - Check for Shield Advanced State
  - All public regions & Global (Amazon CloudFront locations) - No charge per policy per Region
  - AWS WAF WebACLs or Rules created by Firewall Manager - Included. No additional charge.

## 3.2.4
### Fixed
- Update TestCases for WAF Testing
  - community-user-agent testcases 
  - improve owasp testcases
- Update Testing bin Version

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
## 3.3.0
### Added
- Refactor of `bin/aws-firewall-factory.ts`, grouping duplicated code on a function, adding comments and better organizing the file.

- Adds a centralized IPSets management feature.
  No more we'll have to be manually updating ipsets across multiple AWS accounts, it can be defined in code and replicated for use by WAF rules everywhere its needed. Check the examples for defining ipsets on `values/ipsets/*` and for using them in the WebACLs on `values/ip-sets.json`.

=======
=======
=======
## 3.2.3
### Fixed
- Bump eslint from 8.41.0 to 8.42.0
- Bump @typescript-eslint/eslint-plugin from 4.4.0 to 5.59.11
- Bump @typescript-eslint/parser from 4.4.0 to 5.59.11
- Bump eslint-plugin-import from 2.24.2 to 2.27.5
- Bump jest from 26.4.2 to 29.5.0
- Bump ts-jest from 26.2.0 to 29.1.0
- pinned dependencies to avoid conflicting peer dependencies
- fix eslint issues
- fix logging bucket encryption issues referencing [23513](https://github.com/aws/aws-cdk/issues/23513)
- fix cloudformation warning when using statements that inspect single headers (lowercase name key)

### Added
- Added Linting command `lint` to npm scripts which can be run via `npm run lint`◊
>>>>>>> 2d597da6 (fix: dependencies, single-header cloudformation warning and log bucket encryption bug)
## 3.2.2
### Fixed
- Bump @aws-sdk/client-pricing from 3.332.0 to 3.341.0
- Bump eslint from 8.40.0 to 8.41.0
- Bump @aws-sdk/client-cloudwatch from 3.321.1 to 3.341.0
- Bump @aws-sdk/client-service-quotas from 3.321.1 to 3.342.0
- Bump @aws-sdk/client-fms from 3.332.0 to 3.342.0
>>>>>>> 447c4564 (Version 3.2.2)
## 3.2.1
### Fixed
- Bump aws-cdk from 2.74.0 to 2.79.1 
- Bump @aws-sdk/client-pricing from 3.321.1 to 3.332.0
- Bump constructs from 10.1.314 to 10.2.24 
- Bump @aws-sdk/client-fms from 3.321.1 to 3.332.0 
- Bump eslint-plugin-promise from 5.2.0 to 6.1.1
- Bump @typescript-eslint/eslint-plugin from 4.32.0 to 4.4.0
- Bump @typescript-eslint/parser from 4.32.0 to 4.4.0
- Bump eslint-config-standard from 16.0.3 to 17.0.0
- Bump eslint from 7.32.0 to 8.4.0
>>>>>>> be4283d0 (3.2.1)
## 3.2.0
### Fixed
- conflict peer dependency on package.json
- Add RuleLabels when calculating capacity (its needed)

### Added
- Add CustomResponseBodies + custom actions for custom rules
  This feature adds specifying CustomResponseBodies on the WebAcl and custom actions for custom rules.
## 3.1.9
### Fixed
- Bump @aws-sdk/client-cloudformation from 3.319.0 to 3.321.1
- Bump @aws-sdk/client-pricing from  3.319.0 to 3.321.1
- Bump @aws-sdk/client-fms from  3.319.0 to 3.321.1
- Bump @aws-sdk/client-cloudwatch from 3.315.0 to 3.319.0
- Bump @aws-sdk/client-service-quotas from 3.315.0 to 3.319.0
- Bump typescript from 3.9.10 to 4.9.5
- Bump @types/node from 18.16.1 to 18.16.3
- Helpers - newquota.RequestedQuotas false positive

## 3.1.8
### Fixed
- Bump @aws-sdk/client-cloudformation from 3.315.0 to 3.319.0
- Bump @aws-sdk/client-pricing from 3.315.0 to 3.319.0
- Bump @aws-sdk/client-fms from 3.315.0 to 3.319.0
- Bump aws-cdk-lib from 2.74.0 to 2.76.0
- Bump eslint-plugin-promise from 5.2.0 to 6.1.1
- Bump @aws-sdk/client-wafv2 from 3.52.0 to 3.319.0

## 3.1.7
### Fixed
- Bump @aws-sdk/client-cloudwatch from 3.315.0 to 3.319.0
- Bump @types/node from 10.17.27 to 18.16.1
- Bump ts-node from 9.1.1 to 10.9.1
- Bump @aws-sdk/client-service-quotas from 3.315.0 to 3.319.0
- Bump typescript-json-schema from 0.53.1 to 0.56.0

### Changed:
- adjust dependabot interval to weekly

- ### Added
- added [dependabot](https://github.com/dependabot)
  
- ## 3.1.5
### Fixed
- `versionEnabled` must be set to true if version is defined
- Don't fail in CI is job is skipped
- Enable commiting package-lock.json to repo
## 3.1.4
### Fixed
- Pattern for the WebAcl Description Kudos to [@vboufleur](https://github.com/vboufleur) for fixing this.
- Allow many rule action overrides Kudos to [@vboufleur](https://github.com/vboufleur) for fixing this.
## 3.1.3
### Fixed
- Fix counter in package.json for versioning
## 3.1.2
### Added
- Feature [Issue#52](https://github.com/globaldatanet/aws-firewall-factory/issues/52) - Added Regex for FMS Description Pattern: ^([\p{L}\p{Z}\p{N}_.:/=+\-@]*)$. -> Thanks to [@vboufleur](https://github.com/vboufleur)
- Allow a list of resource types to apply firewall -> Kudos to [@vboufleur](https://github.com/vboufleur) for implementing this feature.

### Fixed
- Updated Readme for DeployHash usage. -> Thanks to [@vboufleur](https://github.com/vboufleur)
- PropertyOverride for s3 Bucket in prerequisites-stack for ObjectLockEnabled
- No empty arrays are allowed on RuleActionOverrides Kudos to [@vboufleur](https://github.com/vboufleur) for fix this.
## 3.1.1
### Added
- Feature [Issue#48](https://github.com/globaldatanet/aws-firewall-factory/issues/48) - The firewall manager policy description is now configurable per policy. - Thanks to [@andre1AB](https://github.com/andre1AB)

## 3.1.0
### Added
- Added OWASP TOP TEN Example Config
- Added OWASP TOP TEN Example Config Generation
- Added Prerequisite Stack Config Generation - Creates Skeleton of Parameters for the Prerequisite Stack
- Added Prerequisite Stack:
  - Creation of S3 Bucket for Logs (Optional)
    - Optional Settings: ObjectLock and Kms Encrytion (Default SSE), CrossAccount Access to the Key and Bucket
  - Creation of KMS Key for FireHose (Optional)
    - Optional Settings: CrossAccount Access to the Key
- RuleActionOverride for ManagedRuleGroups: Action setting to use in the place of a rule action that is configured inside the rule group. You specify one override for each rule whose action you want to change.

### Fixed
- Updated Prequisites section in Readme
- Overwrite Action without Exclude Rules for Managed Rule Groups
- Task validateconfig fails because of missing /test/config-loader.ts - [Issue#46](https://github.com/globaldatanet/aws-firewall-factory/issues/46) - Thanks to [@stoennies](https://github.com/globaldatanet/aws-firewall-factory/issues/46)
- Added OWASP TOP TEN Example Config [Issue#45](https://github.com/globaldatanet/aws-firewall-factory/issues/45) - Thanks to [@mmoallemi99](https://github.com/mmoallemi99)
## 3.0.3
### Added
- Added multi domainname usage in waf-test
### Fixed
- Old GoTestWAF was deprecated. Updated to Version v0.3.1-178-g415bb4c
## 3.0.2
### Added
- Added Cost Calculation for CloudWatch Dashboarding - The CloudWatch Dashboard will now be included in the cost calculation for the WAF.

## 3.0.1
### Fixed
Fix AWS Firewall Factory check for Dashboard

## 3.0.0
### Added
- Added CloudWatch Dashboarding - Set "CreateDashboard": true to get a Dashboard deployed for your Firewall in the central Security Account. To use this Feature the cross-account functionality in CloudWatch must be enabled.
To enable your account to share CloudWatch data with the central security account follow [this](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Cross-Account-Cross-Region.html#enable-cross-account-cross-Region) how to.

### Changed:
- If you leave the version for a ManagedRuleGroup empty the Firewall Factory will retrieve the latest version of the ManageRuleGroup and add it to your configuration.

## 2.5.1

### Fixed
- Diagram Creation using template parameter
## 2.5.0

### Added

- Added:
    - RemediationEnabled?: Indicates if the policy should be automatically applied to new resources.
    - IncludeMap: Specifies the AWS account IDs and AWS Organizations organizational units (OUs) to include in the policy.
    - ExcludeMap?: Specifies the AWS account IDs and AWS Organizations organizational units (OUs) to exclude from the policy.
    - ResourceTags?: An array of ResourceTag objects, used to explicitly include resources in the policy scope or explicitly exclude them.
    - ResourcesCleanUp?: Indicates whether AWS Firewall Manager should automatically remove protections from resources that leave the policy scope and clean up resources that Firewall Manager is managing for accounts when those accounts leave policy scope.
    - TaskFile:
        validateconfig: Validates the current config
        generateconfig: Generate skeleton for a waf configuration file
### Removed

- DeployTo will now be managed trough the includeMap
- Example JSON WAF
### Changed:
- A Firewall can now deployed using:  task deploy config=NAMEOFYOURCONFIGFILE without JSON 

## 2.1.3

### Fixed

- Outputs for PostProcess and PreProcess Custom Rule not dynamic

## 2.1.2

### Added

- Price calculation for your WAF
## 2.1.1

### Fixed

- Outputs were not dynamic

## 2.1.0

### Added

- Added Linting with typescript-eslint
- Added .gitignore and .npmignore file
- Added 2 functions for building service data (managed & custom rules) to remove redundant code

### Changed

- Refactoring bin file: outsource capacity checks & other functions to helpers.ts
- Transform capacity.json to Typescript Type Rule
- Start refactoring lib file: get rid of redundant code and use JS shortcuts
- Extend types of the Config interface
- Restructuring runtime properties:  introduce separate layer for PreProcess and PostProcess
- New types for Firewall Manager API and CDK mapping
## 2.0.0

### Added
1. preProcessRuleGroups and postProcessRuleGroups - you can decide now where the Custom or ManagedRules should be added to.

2. RuleLabels - A label is a string made up of a prefix, optional namespaces, and a name. The components of a label are delimited with a colon. Labels have the following requirements and characteristics:

    - Labels are case-sensitive.

    - Each label namespace or label name can have up to 128 characters.

    - You can specify up to five namespaces in a label.

    - Components of a label are separated by colon (:).
### Changed

1. Values Structure:

 - Removed (Rules and ManagedRuleGroups)
 - Added PreProcess and PostProcess

ℹ️ See [example json](./values/example-waf.json).

2. Optimized RuleGroup Splitting - RuleGroups will now be splitted into Groups with up to 1000 WCU.

## 1.0.4

### Added

1. Added S3LoggingBucketName to json. You need to specify the S3 Bucket where the Logs should be placed in now. We also added a Prefix for the logs to be aws conform (Prefix: AWSLogs/AWS_ACCOUNTID/FirewallManager/AWS_REGION/).

2. Added Testing your WAF with [GoTestWAF](https://github.com/wallarm/gotestwaf). To be able to check your waf we introduced the **SecuredDomain** Parameter in the json which should be your Domain which will be checked using the WAF tool.

3. Introduced three new Parameters in the taskfile (**WAF_TEST**,**CREATE_DIAGRAM** and **CDK_DIFF**).

| Parameter   |      Value      |
|----------|:-------------:|
| WAF_TEST |  true (testing your waf with GoTestWAF) </br> false (Skipping WAF testing)  |
| CREATE_DIAGRAM |  true (generating a diagram using draw.io) </br> false (Skipping diagram generation)  |
| CDK_DIFF |  true (generating a cdk before invoking cdk deploy) </br> false (Skipping cdk diff)  |

4. Add schema validation
## 1.0.3

### Added

New Support for Captcha - You can now add Captcha as Action to your WAFs. AWS WAF Captcha is available in the US East (N. Virginia), US West (Oregon), Europe (Frankfurt), South America (Sao Paulo), and Asia Pacific (Singapore) AWS Regions and supports Application Load Balancer, Amazon API Gateway, and AWS AppSync resources.
## 1.0.2

### Added 
#### Rule Name 
You can now name your Rules. If you define a Name in your RulesArray the Name + a Base36 Timestamp will be used for creation of your Rule - otherwise a name will be generated. This will help you to query your logs in Athena. The same Rulename also apply to the metric just with adding "-metric" to the name.
## 1.0.1

Updated Readme - Community Release
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



