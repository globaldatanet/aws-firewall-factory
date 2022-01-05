[![License: Apache2](https://img.shields.io/badge/license-Apache%202-lightgrey.svg)](http://www.apache.org/licenses/) [![cdk](https://img.shields.io/badge/aws_cdk-v2-orange.svg)](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
[![latest](https://img.shields.io/badge/latest-release-yellow.svg)](https://github.com/globaldatanet/aws-firewall-factory/releases)


[![gdn](https://img.shields.io/badge/by-globaldatanet-%2300ecbd)](https://globaldatanet.com) [![dakn](https://img.shields.io/badge/by-dakn-%23ae0009.svg)](https://github.com/daknhh)




# Web Application Firewalls at Scale 

<img align="left" src="./static/icon/firewallfactory.svg" width="150">

AWS Web Application Firewalls (WAFs) protect web applications and APIs from typical attacks from the Internet that can compromise security and availability, and put undue strain on servers and resources. The AWS WAF provides prebuilt security rules that help control bot traffic and block attack patterns. However, with its help, you can also create your own rules based on your specific requirements. In simple scenarios and for smaller applications, this is very easy to implement on an individual basis. However, in larger environments with tens or even hundreds of applications, it is advisable to aim for central governance and automation. This simple solution helps you deploy, update, and stage your Web Application Firewalls while managing them centrally via AWS Firewall Manager.

|Releases |Author  | 
--- | --- |
| [Changelog](CHANGELOG.md) - [Features](#Features)| David Krohn </br> [Linkedin](https://www.linkedin.com/in/daknhh/) - [Blog](https://globaldatanet.com/our-team/david-krohn)|


## Architecture

![Architecture](./static/AWSFIREWALLMANAGER.png "Architecture")

### Prerequisites:
1. An central S3 Bucket with **write** permission for security account needs to be in place.

## Features

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

## Coming soon:

1. Deployment via Teamcity 



# Deployment via Taskfile

0. Create new json file for you WAF and configure Rules in the JSON (see [example.json](values/example-waf.json) to see structure)
1. Set `PROCESS_PARAMETERS` in `Taskfile.yml` for new json file
2. Assume AWS Profile `awsume PROFILENAME`
3. Enter `task deploy`

![Example Deployment](./static/example_deployment.jpg "Example Deployment")
