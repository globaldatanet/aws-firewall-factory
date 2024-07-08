# Change Log

## Released
## 4.5.0
### Added
 - Added support for deploying Shield Advanced policies, including the ability to calculate pricing. AWS Shield Advanced provides customized detection based on traffic patterns to your protected resources, detects and alerts on smaller DDoS attacks, and identifies application layer attacks by baselining traffic and spotting anomalies.
 For Shield Advanced policies, we have introduced an Advanced Shield stack with [sample configurations](./values/examples/shield-advanced.ts).
 __Note__: If you are deploying WAF in a CI/CD environment, make sure you set your environment variable STACK_NAME for the resource you want to deploy.
    - `export STACK_NAME=PreRequisiteStack` => _prerequisites-stack.ts
    - `export STACK_NAME=WAFStack` => _web-application-firewall-stack.ts
    - `export STACK_NAME=ShieldAdvancedStack` => _shield-advanced-stack.ts
-  Add Shield Cloudwatch Dashboard - [Example Shield Dashboard](./static/shield-dashboard.png)- The Firewall Factory is able to provision a centralized CloudWatch Dashboard.
  The Dashboard shows the ammount of DDoS attacks detected
  - Add Grafana Dashbording - [Example Grafana Dashboard](./static/grafana-dashboard.jpg)- AWS Glue crawler job, an Amazon Athena table and an Amazon Athena view to build a Managed Grafana dashboard to visualize the events in near real time - This is an optional component in the Prequisite Stack. 
  Example Grafana Dashboard can be found [here](./static/grafana/waf-dashboard.json)
  __Note__:
    - Your need to configure [Amazon Athena Data Source](https://docs.aws.amazon.com/athena/latest/ug/work-with-data-stores.html) in Amazon Managed Grafana
      - Example Role template for Cross Account Access can be found [here](./static/cf-templates/grafana-role.yaml)
    - ⚠️ You need to adjust the json and replace the  uid of your grafana-athena-datasource - while importing into your Grafana.


### Fixed
- Bump @aws-sdk/client-cloudformation to  3.606.0
- Bump @aws-sdk/client-cloudfront to 3.606.0
- Bump @aws-sdk/client-cloudwatch to 3.606.0
- Bump @aws-sdk/client-config-service to 3.606.0
- Bump @aws-sdk/client-ec2 to 3.606.0
- Bump @aws-sdk/client-fms to 3.606.0
- Bump @aws-sdk/client-pricing to 3.606.0
- Bump @aws-sdk/client-s3 to 3.606.0
- Bump @aws-sdk/client-iam to 3.606.0
- Bump @aws-sdk/client-secrets-manager to 3.606.0
- Bump @aws-sdk/client-service-quotas to 3.606.0
- Bump @aws-sdk/client-shield to 3.606.0
- Bump @aws-sdk/client-ssm to 3.606.0
- Bump @aws-sdk/client-wafv2 to 3.606.0
- Bump @aws-solutions-constructs/aws-eventbridge-stepfunctions to 2.60.0
- Bump @babel/traverse to 7.24.7
- Bump @mhlabs/cfn-diagram to 1.1.40
- Bump @slack/types to 2.12.0
- Bump @types/aws-lambda to 8.10.140
- Bump @types/lodash to 4.17.6
- Bump @types/uuid to 10.0.0
- Bump adaptivecards to 3.0.4
- Bump aws-cdk-lib to 2.148.0
- Bump axios to 1.7.2
- Bump cdk-sops-secrets to 1.12.0
- Bump cfonts to 3.3.0
- Bump npm to 10.8.1
- Bump table to 6.8.2
- Bump uuid to 10.0.0
- Bump @types/node to 20.14.9
- Bump @typescript-eslint/eslint-plugin to 7.14.1
- Bump @typescript-eslint/parser to 7.14.1
- Bump aws-cdk to 2.147.2
- Bump ts-jest to 29.1.5

## 4.3.1
### Added
- [Issue#365](https://github.com/globaldatanet/aws-firewall-factory/issues/365) UnutilizedWafs - Implemented automated identification and notification system in Firewall Factory to manage unused WAFs, leveraging Lambda and notification services to streamline infrastructure, optimize costs, and enhance security by addressing WAF sprawl proactively and ensuring efficient resource utilization.
- Added example IAM Role which can be used for [ci-cd](./static/cf-templates/ci-cd-role.yaml) deployments

### Fixed
- [Issue#380](https://github.com/globaldatanet/aws-firewall-factory/issues/380) Fixes on the CloudWatch dashboard.
- Restructure Lambda code with ShareComonents to reduce code duplicates
- Using [cdk-sops-secrets](https://github.com/dbsystel/cdk-sops-secrets) now for all Webhooks - see WebHookSecretDefinition:
 ```
  {
    WebhookUrl: string
    Messenger: "Slack" | "Teams"
  }
```
- Adding missing: Optional Lambda function to prerequisite Stack that send notifications about potential DDoS activity for protected resources to messengers (Slack/Teams) - [AWS Shield Advanced] - this was removed while migrating lambdas from python to typescript
- Bump @aws-sdk/client-cloudformation from 3.554.0  to 3.556.0
- Bump @aws-sdk/client-cloudfront from  3.568.0 to  3.577.0
- Bump @aws-sdk/client-cloudwatch from 3.554.0 to  3.556.0
- Bump @aws-sdk/client-config-service from  3.568.0 to  3.577.0
- Bump @aws-sdk/client-ec2 from  3.568.0 to  3.577.0
- Bump @aws-sdk/client-fms from 3.554.0 to  3.577.0
- Bump @aws-sdk/client-pricing from 3.554.0 to  3.556.0
- Bump @aws-sdk/client-s3 from  3.569.0 to  3.577.0
- Bump @aws-sdk/client-service-quotas from 3.554.0 to  3.577.0
- Bump @aws-sdk/client-shield from 3.554.0 to  3.556.0
- Bump @aws-sdk/client-ssm from 3.554.0 to  3.577.0
- Bump @aws-sdk/client-wafv2 from 3.554.0 to  3.556.0
- Bump aws-cdk from  2.137.0 to  2.142.0
- Bump aws-cdk-lib from 2.137.0 to  2.142.0
- Bump @typescript-eslint/eslint-plugin from 7.6.0 to 7.9.0
- Bump @typescript-eslint/parser from 7.6.0 to 7.9.0
- Bump @types/lodash  from 4.17.0 to 4.17.1


## 4.3.0
### Added
- Allow reusing ipsets with same name. This commit differentiate ipsets from different FMS configs by adding the name of the webacl to it. Without this commit, trying to run aws-firewall-factory for two configs which uses a ipset with the same name would give a error on CloudFormation ('IpSet with name x already exists') - (Add Name of web application firewall to the IPSet Name) - ⚠️ Existing IPsets will be replaced during next update.
- CheckCapacity: see which rule failed. This commit helps a lot by immediately letting us know which rule failed capacity checking and requires fixes
- Save chars on ManagedServiceData FMS prop. The ManagedServiceData has a hard limit of 8192 characters. I've asked AWS about raising it and they said that this is a hard limit and they can't raise it. This commit is for saving as much chars as we can out of the ManagedServiceData prop, for squeezing in our rules (even if they have a ton of RuleActionOverrides on them)
- Values: allow async code. This adds a dynamic import of the firewall config for enabling people that want to run async code on then, ensuring that all async code will run during the import
- [Issue#317](https://github.com/globaldatanet/aws-firewall-factory/issues/317) Evaluation time windows for request aggregation with rate-based rules. You can now select time windows of 1 minute, 2 minutes or 10 minutes, in addition to the previously supported 5 minutes.
- Extend Guidance Helper to check for valid Evaluation time windows.
- CustomRule StatementType is now part of the log Capacity Table
### Fixed
- RateBasedStatement.CustomKeys is a array of objects, not a object
- Recursive code for adding RateBasedStatement.ScopeDownStatement. The prop ScopeDownStatement of RateBasedStatements can have And, Or and Not statements, just like any other Statement. Without this fix, deploying RateBasedStatements with complex ScopeDownStatements fails on capacity checking.
- Don't enforce update if EnforceUpdate prop is not defined. If its not defined, set `EnforceUpdate` to `false`.
- Enhance the enumcheck to handle API throttling by adding sleep functionality.
- Bumped Jest from version 29.7.0 to 29.7.0
- Bumped TypeScript from version 5.3.3 to 5.4.5
- Bumped ESLint from version 8.56.0 to 8.56.0
- Bumped Axios from version 1.6.5 to 1.6.8
- Bumped @typescript-eslint/parser and @typescript-eslint/eslint-plugin from version 6.19.0 to 7.6.0
- Bumped AWS CDK from version 2.121.1 to 2.137.0
- Bumped @aws-sdk/client-cloudformation, @aws-sdk/client-cloudwatch, @aws-sdk/client-fms, @aws-sdk/client-pricing, @aws-sdk/client-service-quotas, @aws-sdk/client-shield, @aws-sdk/client-ssm, and @aws-sdk/client-wafv2 from version 3.490.0 to 3.554.0
- Removed redundant declaration of "@typescript-eslint/eslint-plugin" and "@typescript-eslint/parser" dependencies.
- Removed redundant declaration of "@types/lodash" dependency.
- Added missing comma after TypeScript version 5.3.3 in devDependencies.
- Add CDK ToolKit StackName to cdk diff using taskfile - Sometimes the following error occurred if the template is more than 50kb in size this was because the cdk toolkit stackname was not set. 
  - eg.: The template for stack "YOURSTACKNAME" is 64KiB. Templates larger than 50KiB must be uploaded to S3.

## 4.2.3
### Added
- Initial release of Enum Checker script. Implemented functionality to check for new Labels and Rules available for Managed Rule Groups. Provides clear output indicating any new Labels or Rules discovered.
- [Issue#295](https://github.com/globaldatanet/aws-firewall-factory/issues/295) - Optional Athena table added to Prerequisites stack: Introducing support for the Athena WAF (web application firewall) log table. Users can now easily query and analyse WAF log data using Athena. Gain insight into web application security events, including blocked requests, allowed traffic and threat patterns.

### Fixed
- [Issue293](https://github.com/globaldatanet/aws-firewall-factory/issues/293) Warning on task deploy: "aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated." - We are creating now a fully customizable log group with `logs.LogGroup`.
ℹ️ Migrating from `logRetention` to `logGroup` will cause the name of the log group to change.
- False Positive for Guidance: noManageRuleGroups
- Added new Labels and Rules which are available for Managed Rule Groups to enum.ts
- Bump @types/node from 20.11.5 to 20.11.19
- Bump @typescript-eslint/eslint-plugin from 6.19.0 to 7.0.0
- Bump @aws-sdk/client-wafv2 from 3.496.0 to 3.515.0
- Bump aws-cdk-lib from 2.121.1 to 2.128.0
- Bump @types/uuid from 9.0.7 to 9.0.8

## 4.2.2
### Added
- Guidance Helper v1: This Helper is designed to provide comprehensive assistance in implementing Best Practices for AWS Firewalls. Additionally, it addresses [Issue279](https://github.com/globaldatanet/aws-firewall-factory/issues/279), ensuring a more robust and effective implementation. Guidances have severities: ℹ️ - can be adapted, ⚠️ should be adapted, 🚨 must be adapted - exceptions of course confirm the rules.
### Fixed
- The conversion of rules from CDK to SDK for RateBasedStatement was experiencing issues, impacting the proper functioning essential for WCU Calculation. I'm pleased to inform you that this issue has been successfully addressed and resolved.

## 4.2.1
### Fixed
- [Issue285](https://github.com/globaldatanet/aws-firewall-factory/issues/285) - Resolved an issue where the redeployment of changed capacity was not functioning correctly due to inconsistencies in the writing of ProcessProperties for DeployedRuleGroups.
- Bump ts-jest from 29.1.1 to 29.1.2
- Bump @aws-sdk/client-wafv2 from 3.490.0 to 3.496.0
- Bump @aws-sdk/client-service-quotas from 3.490.0 to 3.496.0
- Bump @types/node from 20.11.4 to 20.11.5
- Bump @aws-sdk/client-pricing from 3.490.0 to 3.496.0

## 4.2.0
### Fixed
- Output of the correct ManagedRuleGroup version if the stack has already been deployed, no version has been specifically set or Enforce Update has been set
- Restructuring helpers to facilitate smoother integration with the code, particularly for all contributors. Helpers are now seperated into different files and directories grouped by aws service / usage.
- Fixed Codesmells which where found by SonarQube
- VersionEnabled behavior fixed for ManageRuleGroups
- Python Lambda translated into typescript
- Code was improved by removing Code duplications and enriched by more comments and descriptions.
- Bump @aws-sdk/client-service-quotas from 3.427.0 to 3.490.0
- Bump @aws-sdk/client-pricing from 3.427.0 to 3.490.0
- Bump @aws-sdk/client-shield from 3.433.0 to 3.490.0
- Bump @aws-sdk/client-cloudformation from 3.428.0 to 3.490.0
- Bump @aws-sdk/client-cloudwatch from 3.427. to 3.490.0
- Bump @aws-sdk/client-fms from 3.427.to 3.490.0
- Bump @aws-sdk/client-wafv2 from 3.427.0 to 3.490.0
- Bump @types/node 20.8.10 from to 20.11.4
- Bump @typescript-eslint/parser from 6.7.5 to 6.19.0
- Bump @typescript-eslint/eslint-plugin from 6.13.2 to 6.19.0
- Bump aws-cdk-lib from 2.100.0 to 2.121.1
- Bump eslint  from 8.53.0 to 8.56.0
- Bump ts-node from 10.9.1 to 10.9.2
- Bump typescript from 5.2.2 to 5.3.3
- Bump @types/lodash from 4.14.178 to 4.14.202
- Bump constructs from 10.2.25 to 10.3.0
- Bump typedoc-plugin-keywords from 1.5.0 to 1.6.0

## 4.1.6
### Fixed
- Fixed Region addression in CloudWatch expressions for Dashboard
- Bump @types/aws-lambda from 8.10.124 to 8.10.130
- Bump @typescript-eslint/eslint-plugin from 6.10.0 to 6.13.2
### Added
- Add Optional setting to Config OverrideCustomerWebACLAssociation - Decide if FMS should replace web ACLs that are currently associated with in-scope resources with the web ACLs created by this policy - Default is False
- Add Optional setting to Config awsManagedRulesBotControlRuleSetProperty - Details for your use of the Bot Control managed rule group, AWSManagedRulesBotControlRuleSet . See also: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesbotcontrolruleset.html
- Add Optional setting to Config awsManagedRulesACFPRuleSetProperty - Details for your use of the account creation fraud prevention managed rule group, AWSManagedRulesACFPRuleSet. See also: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesacfpruleset.html
- Add Optional setting to Config awsManagedRulesATPRuleSetProperty - Details for your use of the account takeover prevention managed rule group, AWSManagedRulesATPRuleSet. See also: http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesatpruleset.html

## 4.1.5
### Fixed
- Addressed issue with missing WCU Calculation OR statement within AND statement. - [Issues232](https://github.com/globaldatanet/aws-firewall-factory/issues/232)
- Addressed issue with missing WCU Calculation AND statement within OR statement.
- Bump @typescript-eslint/eslint-plugin from 6.7.5 to 6.10.0
- Bump eslint from 8.51.0 to 8.53.0

## 4.1.4
### Added
- Automation for  [Documentation](https://docs.aws-firewall-factory.com/) for the AWS Firewall Factory to assist you in utilizing our solution.
The documentation will be updated regularly to provide you with the most current information. We also added more comments to functions and enums to provide more information to you. [Issue 220](https://github.com/globaldatanet/aws-firewall-factory/issues/220)
- First preperations to support for [Network Firewalls](https://github.com/globaldatanet/aws-firewall-factory/issues/219)

### Fixed
- Console log error if only one Managed Rule Group was specified - the table output was not working for PostProcess.
- Bump @mhlabs/cfn-diagram from 1.1.29 to 1.1.38 -> thanks to [ljacobsson](https://github.com/ljacobsson) for the new release
- Bump @babel/traverse to 7.23.2
- Bump @types/uuid from 9.0.5 to 9.0.7
- Bump @types/node from 18.16.3 to 20.8.10 

## 4.1.3
### Added
- Optional Lambda function to prerequisite Stack that send notifications about potential DDoS activity for protected resources to messengers (Slack/Teams) - [AWS Shield Advanced]
- Automated test workflows of example firewalls, to ensure code quality and test coverage

### Fixed
- Bump @aws-sdk/client-cloudformation from 3.427.0 to 3.428.0
- Bump @aws-sdk/client-shield from 3.427.0 to 3.428.0
- Bump typescript from 4.9.5 to 5.2.2
- Bump jest from 29.5.0 to 29.7.0
- Bump eslint from 8.48.0 to 8.51.0

## 4.1.2

### Fixed
- Separate NotStatements where not parsed correctly while deployment
- Bump @typescript-eslint/eslint-plugin 6.7.4 from to 6.7.5
- Bump @typescript-eslint/parser 6.0.0 from to 6.7.5

## 4.1.1
### Added
- Added Console output if ManagedRuleGroup OverrideAction is set to Count - This option is not commonly used. If any rule in the rule group results in a match, this override sets the resulting action from the rule group to Count.
- Enums for all AWS ManagedRuleGroup Rules and Labels, this will help you to not create exclude Rules of Label Match Statements for none existing Rules or Labels. AWS CloudFormation even not trow any error right now if you try use not existing Labels or Rules.
- Optional Lambda function to prerequisite Stack that sends notifications about changes in AWS managed rule groups, such as upcoming new versions and urgent security updates, to messaging platforms like Slack or Teams.
### Fixed
- RegexPatternSets and IPSets in NotStatements AWS Firewall Factory are ignored while WCU calculation
- gotestwaf task was not customized for Typescript configuration files.
- ManagedRuleGroupVersion lambda was always using the latest ManagedRulegroup version if no version was specified. Now the lambda function is using the [current Default version](https://docs.aws.amazon.com/waf/latest/developerguide/waf-managed-rule-groups-versioning.html).
- Added Optional Parameter for ManagedRuleGroupVersion lambda, you can now set enforceUpdate to load the latest or the current Default version during WAF update.
- Bump @aws-cdk-lib from 2.93.0 to 2.100.0
- Bump @aws-cdk from 2.93.0 to 2.100.0
- Bump @aws-sdk/client-cloudformation from 3.398.0 to 3.427.0
- Bump @aws-sdk/client-cloudwatch from 3.398.0 to 3.427.0
- Bump @aws-sdk/client-fms from 3.398.0 to 3.427.0
- Bump @aws-sdk/client-pricing from 3.398.0 to 3.427.0
- Bump @aws-sdk/client-service-quotas from 3.398.0 to 3.427.0
- Bump @aws-sdk/client-shield from 3.398.0 to 3.427.0
- Bump @aws-sdk/client-wafv2 from 3.398.0 to 3.427.0
- Bump @typescript-eslint/eslint-plugin from 6.4.1 to 6.7.4

## 4.1.0

### Added
- This update presents a new feature that centralizes the management of RegexPatternSet. With this improvement, manual updates of regexpatternset across multiple AWS accounts are no longer necessary.
  Users can now define the feature in code and replicate it for use by WAF rules wherever applicable.
- Additionally, cdk destroy has been included in the taskfile.
- Furthermore, we have modified several enums to enhance their ease of with previous versions: use while maintaining downward compatibility, such as
  - WebAclScope
  - AwsManagedRules
  - ManagedRuleGroupVendor
  - CustomResponseBodiesContentType
  - WebAclTypeEnum
- uuidFirewallFactoryResourceIdentitfier: Introducing a firewall identifier UUID that will be utilized for resource names in AWS.

### Fixed
- Capacity and version information for Managed Rule Groups are now optional. We calculate the capacity on the fly, so specifying capacity is unnecessary. If no version is provided, we will retrieve the latest version for the Managed Rule Group using the API.
- DeliveryStreamName not checked - Erroneous if exceeding 64 character limit [source](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-kinesisfirehose-deliverystream.html#cfn-kinesisfirehose-deliverystream-deliverystreamname).
- Fixed nonfunctional documentation links.

### Removed
- Export names from CloudFormation stack outputs, as we rely on the stack name and output names from the particular CloudFormation stack to obtain the necessary information.
## 4.0.0
### Added
- A custom resource to retrieve the latest version of the ManagedRuleGroup and check if the specified version is valid.
- Typescript configuration files for WAF configurations - now it is easier to write custom rules because of the types for [rule statements](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_wafv2.CfnWebACL.RuleProperty.html).
- A function to convert CdkRule to SdkRule - with the introduction of Typescript configuration and CDK interfaces, we now need to convert every CDK rule to an SDK rule to be able to use the [CheckCapacity API call](https://docs.aws.amazon.com/waf/latest/APIReference/API_CheckCapacity.html).
- ManagedRuleGroupVersions for CloudFormation Output
- Example Configurations
    1.  Example WAF configuration against: [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
    2.  Example configuration for prerequisite stack
- Added TOOL_KIT_STACKNAME to the TaskFile - to specify the name of the bootstrap stack ([see Bootstrapping your AWS environment](https://docs.aws.amazon.com/cdk/v2/guide/cli.html#cli-bootstrap)).
- Migrate script to migrate from json to ts config (./values/migrate.ts)
  - ts node ./values/migrate.ts YOURJSON.json
- You now need to set the priority for your custom rules. If you want to learn more about processing order of rules and rule groups in a web ACL, check out this [link](https://docs.aws.amazon.com/waf/latest/developerguide/web-acl-processing-order.html).

### Fixed
- Allow sub-statements of IPSetReferenceStatements -> Allow IPSetReferenceStatement.ARN entries that reference an aws-firewall-factory controlled ipset (i.e. the name of the ipset) within AND, OR and NOT statements (as sub-statements).
- Adjusted WAF Config skeleton generation function for Typescript configuration.
- Updated dependencies to the latest version

### Removed
- Json config files for WAF configurations
- DeployHash generation for new configs - legacy functionality - we will now use Prefix, Stage & FirewallName to create unique WAF and CloudFormation StackNames.

## 3.3.1
### Fixed
- example Json Files
- Bump @aws-cdk from 2.79.1 to 2.89.0
- Bump @mhlabs/cfn-diagram from 1.1.36 to 1.1.29
- Bump @aws-cdk-lib from 2.77.0 to 2.80.0
- Bump typescript-json-schema from 0.56.0 to 0.59.0

## 3.3.0
### Added
- Refactor of `bin/aws-firewall-factory.ts`, grouping duplicated code on a function, adding comments and better organizing the file.
- Refactor of `lib/firewall-stack.ts`, outsource the creation of the CloudWatch Dashboard into an own Construct

- Adds a centralized IPSets management feature.
  No more we'll have to be manually updating ipsets across multiple AWS accounts, it can be defined in code and replicated for use by WAF rules everywhere its needed. Check the examples for defining ipsets and  using them in the WebACLs on `values/ip-sets-managed.json`.

- Logging to S3, you can now decide if you want to send your WAF logs directly to S3 or via Firehose
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
## 3.2.2
### Fixed
- Bump @aws-sdk/client-pricing from 3.332.0 to 3.341.0
- Bump eslint from 8.40.0 to 8.41.0
- Bump @aws-sdk/client-cloudwatch from 3.321.1 to 3.341.0
- Bump @aws-sdk/client-service-quotas from 3.321.1 to 3.342.0
- Bump @aws-sdk/client-fms from 3.332.0 to 3.342.0
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
- Feature [Issue#52](https://github.com/globaldatanet/aws-firewall-factory/issues/52) - Added Regex for FMS Description Pattern:  ([\p{L}\p{Z}\p{N}_.:/=+\-@]*)$. -> Thanks to [@vboufleur](https://github.com/vboufleur)
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



