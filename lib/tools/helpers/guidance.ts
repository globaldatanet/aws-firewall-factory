import { RuntimeProps, WafConfig } from "../../types/config/index";

/**
This function will help you to get guidance on implementing Best Practices for AWS Firewalls.
@param context - The context of the guidance. For example, nestedRateStatement.
@param source - The source of the guidance. For example, ManagedRuleGroup.
 */
export function getGuidance(context: string, runtimeProperties: RuntimeProps, source?: string) {
  switch(context){
    case "nestedRateStatement":
      runtimeProperties.Guidance.nestedRateStatementCount++;
      if(source){
        runtimeProperties.Guidance.nestedRateStatementInfo.push(source);
      }
      break;
    case "overrideActionManagedRuleGroup":
      runtimeProperties.Guidance.overrideActionManagedRuleGroupCount++;
      if(source){
        runtimeProperties.Guidance.overrideActionManagedRuleGroupInfo.push(source);
      }
      break;
    case "noManageRuleGroups":
      runtimeProperties.GuidanceSummary.push("\x1b[31m","\n    🚨  No ManagedRuleGroups are used in your Firewall.\n       https://docs.aws.amazon.com/waf/latest/developerguide/waf-managed-rule-groups.html.","\x1b[0m");
      break;
    case "deploymentHash":
      runtimeProperties.GuidanceSummary.push("\x1b[33m","    ⚠️  Legacy functionality ⌛️ \n This functionality will be removed soon. \n","\x1b[0m");
      break;
    case "byteMatchStatementPositionalConstraint":
      runtimeProperties.Guidance.byteMatchStatementPositionalConstraintCount++;
      if(source){
        runtimeProperties.Guidance.byteMatchStatementPositionalConstraintInfo.push(source);
      }
      break;
    case "noBotControlRuleSetProperty":
      runtimeProperties.GuidanceSummary.push("\x1b[33m","\n    ⚠️  No BotControlRuleSetProperty is used in your ManagedRulesBotControlRuleSet.\n       https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-wafv2-webacl-awsmanagedrulesbotcontrolruleset.html.","\x1b[0m");
      break;
    case "noRuleLabels":
      runtimeProperties.Guidance.noRuleLabelsCount++;
      if(source){
        runtimeProperties.Guidance.noRuleLabelsInfo.push(source);
      }
      break;
    case "noAWSManagedIPDDoSList":
      runtimeProperties.GuidanceSummary.push("\x1b[33m","\n    ⚠️  No AWSManagedRulesAmazonIpReputationList is used in your Firewall - These Rules identify and block IPs acting as bots, conducting reconnaissance on AWS resources, or involved in DDoS activities. AWSManagedIPDDoSList rule has effectively blocked over 90% of malicious request floods.","\x1b[0m");
      break;
    case "wrongEvaluationWindowSec":
      runtimeProperties.GuidanceSummary.push("\x1b[31m",`\n    🚨  ${source} is not a EvaluationWindowSec for RateBasedStatements - Valid Settings are 60, 120, 300, and 600. \n       https://docs.aws.amazon.com/waf/latest/APIReference/API_RateBasedStatement.html.`,"\x1b[0m");
      break;
    case "remediationNotEnabled":
      runtimeProperties.GuidanceSummary.push("\x1b[33m","\n    ⚠️  Remediation is not enabled for your Shield Policy. \n       Remediation takes care that the policy is automatically be applied to new resources.","\x1b[0m");
      break;
    default:
      break;
  }
}


/**
This function will print out the collected guidance for your Firewall.
@param runtimeProperties - The runtimeProperties object.
 */
export function outputGuidance(runtimeProperties: RuntimeProps, config?: WafConfig) {
  if(runtimeProperties.GuidanceSummary.length !== 0 || runtimeProperties.Guidance.nestedRateStatementCount !== 0 || runtimeProperties.Guidance.overrideActionManagedRuleGroupCount !== 0 || runtimeProperties.Guidance.noRuleLabelsCount !== 0 || runtimeProperties.Guidance.byteMatchStatementPositionalConstraintCount !== 0){
    console.log("\x1b[0m","\n🛟  Guidance:","\x1b[0m");
    runtimeProperties.GuidanceSummary.forEach(element => {
      console.log(element);
    });
  }
  if(runtimeProperties.Guidance.nestedRateStatementCount !== 0){
    console.log("\x1b[31m",`\n    🚨  Found ${runtimeProperties.Guidance.nestedRateStatementCount} Nested RateBasedStatement  - You cannot nest a RateBasedStatement inside another statement, for example inside a NotStatement or OrStatement.\n        You can define a RateBasedStatement inside a web ACL and inside a rule group.`,"\x1b[0m");
    console.log("\x1b[1m","       Affected Statements:\n","\x1b[0m");
    runtimeProperties.Guidance.nestedRateStatementInfo.forEach(element => {
      console.log("        − "+element);
    });
  }
  if(runtimeProperties.Guidance.overrideActionManagedRuleGroupCount !== 0){
    console.log("\x1b[31m",`\n    🚨  Found OverrideAction in ManagedRuleGroup - OverrideAction of ${runtimeProperties.Guidance.overrideActionManagedRuleGroupCount} ManagedRuleGroup is set to COUNT, which simply tallies all rules within the group.\n        However, this practice may create a vulnerability in your firewall and is not recommended.`,"\x1b[0m");
    console.log("\x1b[1m","       Affected ManagedRuleGroups:\n","\x1b[0m");
    runtimeProperties.Guidance.overrideActionManagedRuleGroupInfo.forEach(element => {
      console.log("        − "+element);
    });
  }
  if(runtimeProperties.Guidance.noRuleLabelsCount !== 0){
    console.log("\x1b[0m",`\n    ℹ️  Found ${runtimeProperties.Guidance.noRuleLabelsCount} CustomRules without RuleLabels - Rule Labels help you to mitigate False/Positives.`,"\x1b[0m");
    console.log("\x1b[1m","      Affected CustomRules:\n","\x1b[0m");
    runtimeProperties.Guidance.noRuleLabelsInfo.forEach(element => {
      console.log("        − "+element);
    });
  }
  if(runtimeProperties.Guidance.byteMatchStatementPositionalConstraintCount !== 0){
    console.log("\x1b[0m",`\n    ℹ️  Found ${runtimeProperties.Guidance.byteMatchStatementPositionalConstraintCount} ByteMatchStatements with PositionalConstraint - It is cheaper from WCU perspektive to use a RegexMatchStatement in this Case.`,"\x1b[0m");
    console.log("\x1b[1m","      Affected CONTSTRAINT Information:\n","\x1b[0m");
    runtimeProperties.Guidance.byteMatchStatementPositionalConstraintInfo.forEach(element => {
      console.log("        − "+element);
    });
  }
  if(runtimeProperties.Guidance.rateBasedStatementCount === 0 && config?.WebAcl.Type === "AWS::ElasticLoadBalancingV2::LoadBalancer"){
    console.log("\x1b[0m","\n    ℹ️  You are securing a LoadBalancer with your Firewall with usage of a RateBasedStatement.\n       RateBasedStatements empower you to automatically block requests originating from problematic source IPs until their request rate diminishes below a predetermined threshold.","\x1b[0m");
  }
  console.log("\n\n");
}
