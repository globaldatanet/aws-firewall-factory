
[📦 Releases](https://github.com/globaldatanet/aws-firewall-factory/releases) - [🔖 Imprint](https://globaldatanet.com/imprint) - [📅 Meeting](https://calendly.com/dakn/30min-1)

## ⁉️ .What is a Web Application Firewall?

A crucial security component for **every** web app. It acts as a **protective barrier** between your application and potential threats. Offering a range of **practical functionalities** to mitigate known risks, emerging threats, harmful activities and many more.
✨ AWS Firewall Factory has extended its capabilities to support Advanced Shield policy deployment through AWS Firewall Manager. The Advanced Shield stacks are available starting with our version 4.5 release.

## 🔥 About our AWS Firewall Factory

An open-source solution that helps you **deploy, update and stage** your Web Application Firewalls at scale while managing them centrally via AWS Firewall Manager.

It automates your security management, can be tailored with individual WAF configurations and alligns with **AWS best-practices**.

 - **♾️ Fully automated to centralize your WAF Deployment & Management:**
  It simplifies the entire process by minimising administrative effort. Making it easier for you to ensure consistent protection and overseeing your WAF across applications.

   - **🛡️ Fully automated to centralize your Advanced Shield Policy Deployment:**
  Supports deployment of AWS Advanced Shield Policy through AWS Firewall Manager. You can now seamlessly protect your resources fom DDoS attacks across your accounts in a centralised manner.

 - **🔖 Comprehensive Testing with Detailed Reports:**
  It uncovers wether your application is resilient or not and reports issues precisely. With these insights you can dive deep into strengthening your application’s weaknesses.
 - **🧮 Automate Calculation of Your WAF's Costs:**
  Your smart assistant that overtakes cost estimations in a transparent way, helping you associate expenses to the exact security measures. This will **boost your financial planning.**
- **💌 Notifications about Ddos or Managed Rule Group Changes:**
  Get notified about potential DDoS activity for protected resources or changes in AWS managed rule groups, such as upcoming new versions and urgent security updates.
- ✅ **Additional features such as centralized dashboards and logging:**
Monitor every security event in real time to be able to defend against potential threads and anomalies immediately.

## 🧪 Tests
All releases are tested prior to release using automated test workflows of sample firewalls to ensure code quality and test coverage. Here is the current state for our automated test workflows.

|  Test | Status  |
|---|---|
|  CodeQL | ![CodeQL](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/github-code-scanning/codeql/badge.svg?branch=master)  |
|  Linting | ![linting](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/linting.yml/badge.svg?branch=master)  |
|  WAF Deployment - Only Managed Rule Groups  | ![onlyManagedRuleGroups](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_onlymanagedrulegroups.yml/badge.svg?branch=master)  |
|  WAF Deployment - IpSets | ![IpSets](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_ipSets.yml/badge.svg?branch=master)   |
|  WAF Deployment - RegexPatternSets | ![regexPatternSets](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_regexPatternSets.yml/badge.svg?branch=master)  |
|  WAF Deployment - RateBasedwithScopeDown | ![rateBasedwithScopeDown](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_rateBasedwithScopeDown.yml/badge.svg?branch=master)  |


## 🛡️ Deployment

### ⚙️ Prerequisites
1. [Organizations trusted access with Firewall Manager](https://docs.aws.amazon.com/organizations/latest/userguide/services-that-can-integrate-fms.html)
2. [Taskfile](https://taskfile.dev/)
3. [AWS CDK](https://aws.amazon.com/cdk/)
4. [cfn-dia](https://www.npmjs.com/package/@mhlabs/cfn-diagram?s=03)
5. Invoke `npm i` to install dependencies
6. ⚠️ Before installing a stack to your aws account using aws cdk you need to prepare the account using a [cdk bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

7. (Optional) If you want to use CloudWatch Dashboards - You need to enable your target accounts to share CloudWatch data with the central security account follow [this](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Cross-Account-Cross-Region.html#enable-cross-account-cross-Region) to see how to do it.
8. Assume AWS Profile `awsume PROFILENAME`
9. (Optional) Enter `task generateprerequisitesconfig`
10. Enter `task deploy config=NAMEOFYOURCONFIGFILE prerequisite=true`
11. Select the type of resource to be deployed (Pre-requisite Stacks, WAF or Shield Advanced)
![List of Resources](./static/options.jpg "Stacks")

### 🏁 Deployment via Taskfile

1. Create new ts file for you WAF and configure Rules in the Configuration (see [owasptopten.ts](https://github.com/globaldatanet/aws-firewall-factory/blob/master/values/examples/owasptop10.ts) to see structure) or use enter `task generate-waf-skeleton` / enter `task generate-shield-skeleton`
2. Assume AWS Profile `awsume / assume PROFILENAME`
3. (Optional)
   1. Enter `task generate-waf-skeleton`
   2. Enter `task generate-shield-skeleton`
4. Enter `task deploy config=NAMEOFYOURCONFIGFILE`
5.  Select the type of resource to be deployed (Pre-requisite Stacks, WAF or Shield Advanced)
![List of Resources](./static/options.jpg "Stacks")