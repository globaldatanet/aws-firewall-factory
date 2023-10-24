
## ⁉️ .What is a Web Application Firewall?

A crucial security component for **every** web app. It acts as a **protective barrier** between your application and potential threats. Offering a range of **practical functionalities** to mitigate known risks, emerging threats, harmful activities and many more.

## 🔥 About our AWS Firewall Factory

An open-source solution that helps you **deploy, update and stage** your Web Application Firewalls at scale while managing them centrally via AWS Firewall Manager.

It automates your security management, can be tailored with individual WAF configurations and alligns with **AWS best-practices**.

 - **♾️ Fully automated to centralize your WAF Deployment & Management:**
  It simplifies the entire process by minimising administrative effort. Making it easier for you to ensure consistent protection and overseeing your WAF across applications.

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

