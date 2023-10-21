
[![Mentioned in Awesome CDK](https://awesome.re/mentioned-badge.svg)](https://github.com/kolomied/awesome-cdk)
[![License: Apache2](https://img.shields.io/badge/license-Apache%202-lightgrey.svg)](http://www.apache.org/licenses/) [![cdk](https://img.shields.io/badge/aws_cdk-v2-orange.svg)](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
[![latest](https://img.shields.io/badge/latest-release-yellow.svg)](https://github.com/globaldatanet/aws-firewall-factory/releases)
[![gdn](https://img.shields.io/badge/opensource-@globaldatanet-%2300ecbd)](https://globaldatanet.com/opensource) [![dakn](https://img.shields.io/badge/by-dakn-%23ae0009.svg)](https://github.com/daknhh)
[![TypeScript](https://badges.frapsoft.com/typescript/love/typescript.png?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=AWS%20FIREWALL%20FACTORY%20-%20Deploy%2C%20update%2C%20and%20stage%20your%20WAFs%20while%20managing%20them%20centrally%20via%20FMS&url=https://github.com/globaldatanet/aws-firewall-factory&hashtags=aws,security,waf)
[![roadmap](https://img.shields.io/badge/public-roadmap-yellow.svg)](https://github.com/orgs/globaldatanet/projects/1)


**[🚧 Feature request](https://github.com/globaldatanet/aws-firewall-factory/issues/new?assignees=&labels=feature-request%2C+enhancement&template=feature_request.md&title=)** | **[🐛 Bug Report](https://github.com/globaldatanet/aws-firewall-factory/issues/new?assignees=&labels=bug%2C+triage&template=bug_report.md&title=)**

![aws-firewall-factory](https://socialify.git.ci/globaldatanet/aws-firewall-factory/image?font=Bitter&forks=1&logo=https%3A%2F%2Fgithub.com%2Fglobaldatanet%2Faws-firewall-factory%2Fraw%2F4.1.3%2Fstatic%2Ficon%2Ffirewallfactory.svg&name=1&pattern=Solid&stargazers=1&theme=Dark)

## 𒋰 Table of contents

- [𒋰 Table of contents](#𒋰-table-of-contents)
- [🔭 Overview](#-overview)
- [🎬 Media](#-media)
    - [🔗 Useful Links](#-useful-links)
- [🗺️ Architecture](#️-architecture)
- [🧪 Tests](#-tests)
- [🦸🏼‍♀️ Contributors](#️-contributors)
  - [👩‍💻 Contribute](#-contribute)
  - [👏 Supporters](#-supporters)

|                     Releases                      | Author |
|---------------------------------------------------|--------|
| [Changelog](CHANGELOG.md) - [Features](Features.md) - [🛡️ Deployment](Deployment.md) | David Krohn </br> [Linkedin](https://www.linkedin.com/in/daknhh/) - [Blog](https://globaldatanet.com/our-team/david-krohn)|

</br>

## 🔭 Overview

<img align="left" src="./static/icon/firewallfactory.svg" width="150">

AWS Web Application Firewalls (WAFs) protect web applications and APIs from typical attacks from the Internet that can compromise security and availability, and put undue strain on servers and resources. The AWS WAF provides prebuilt security rules that help control bot traffic and block attack patterns. You can also create your own rules based on your own requirements. In simple scenarios and for smaller applications, this is very easy to implement on an individual basis. However, in larger environments with tens or even hundreds of applications, it is advisable to aim for central governance and automation. This simple solution helps you deploy, update and stage your Web Application Firewalls while managing them centrally via AWS Firewall Manager.

![Example Deployment](./static/example-deployment.gif "Example Deployment")

## 🎬 Media

If you want to learn more about the AWS Firewall Factory feel free to look at the following media resources.

- [📺 Webinar: Web Application Firewalls at Scale - Language: 🇩🇪](https://globaldatanet.com/webinars/aws-security-with-security-in-the-cloud)
- [📺 Webinar: Managing AWS Web Application Firewalls at Scale - Language: 🇺🇸](https://globaldatanet.com/webinars/managing-aws-web-application-firewalls-at-scale)
- [📺 Webinar: Secure Serverless Applications against OWASP TOP 10 in 5 mins - Language: 🇺🇸](https://serverless-summit.io/)
- [📊 Slides: Managing AWS Web Application Firewalls at Scale - Language: 🇺🇸](https://docs.google.com/presentation/d/1jE_DmNk0cCc1XM8eBYPM2za0pzGyg9Lv/edit?usp=sharing&ouid=115444461121738087344&rtpof=true&sd=true)
- Secure Serverless Applications against OWASP TOP 10 in 5 Minutes - Language: 🇺🇸
  - [📊 Slides](https://docs.google.com/file/d/1YJCfTt8ILa2R9n23fHDFLpfLhTwhB4ea/edit?filetype=mspresentation) - [📺 Video](https://www.youtube.com/watch?v=jrYpr0DLKfo)
- [🎙 Podcast coming soon](https://github.com/richarvey/aws-community-radio/issues/3)

#### 🔗 Useful Links

- [🐦🤖 Twitter Bot to get Notified for Managed Rules Updates](https://twitter.com/AWSMgMtRulesBot)
- [🏫 AWS WAF Workshop](https://catalog.us-east-1.prod.workshops.aws/workshops/c2f03000-cf61-42a6-8e62-9eaf04907417/en-US/02-custom-rules)
## 🗺️ Architecture

![Architecture](./static/AWSFIREWALLMANAGER.png "Architecture")

## 🧪 Tests
|  Test | Status  |
|---|---|
|  Linting | ![linting](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/linting.yml/badge.svg?branch=master)  |
|  WAF Deployment - Only Managed Rule Groups  | ![onlyManagedRuleGroups](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_onlymanagedrulegroups.yml/badge.svg?branch=master)  |
|  WAF Deployment - IpSets | ![IpSets](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_ipSets.yml/badge.svg?branch=master)   |
|  WAF Deployment - RegexPatternSets | ![regexPatternSets](https://github.com/globaldatanet/aws-firewall-factory/actions/workflows/waf_test_regexPatternSets.yml/badge.svg?branch=master)  |



## 🦸🏼‍♀️ Contributors

<a href="https://github.com/globaldatanet/aws-firewall-factory/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=globaldatanet/aws-firewall-factory" />
</a>

</br>
Any form of contribution is welcome. The above contributors have been officially released by globaldatanet.
</br>
</br>

</div>

</details>

### 👩‍💻 Contribute

Want to contribute to **AWS FIREWALL FACTORY**? Check out the [Contribution docs](./CONTRIBUTING.md)
</br>

### 👏 Supporters

[![Stargazers repo roster for @globaldatanet/aws-firewall-factory](http://bytecrank.com/nastyox/reporoster/php/stargazersSVG.php?user=globaldatanet&repo=aws-firewall-factory)](https://github.com/globaldatanet/aws-firewall-factory/stargazers)

</br>

<p align="center"><a href="https://github.com/globaldatanet/aws-firewall-factory"><img src="./static/barsSmallTransparentBackground.gif" width="100%"/></a></p>

[^1]: Optional Fields. 
