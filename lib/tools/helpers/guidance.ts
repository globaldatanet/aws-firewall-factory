/**
This function will help you to get guidance on implementing Best Practices for AWS Firewalls.
@param context - The context of the guidance. For example, nestedRateStatement.
@param source - The source of the guidance. For example, ManagedRuleGroup.
 */
export function getGuidance(context: string, source?: string) {
  switch(context){
    case "nestedRateStatement":
      console.log("\x1b[31m",`\n🚨 Found Nested RateBasedStatement in ${source} - You cannot nest a RateBasedStatement inside another statement, for example inside a NotStatement or OrStatement. You can define a RateBasedStatement inside a web ACL and inside a rule group.\n\n`,"\x1b[0m");
      break;
    case "overrideActionManagedRuleGroup":
      console.log("\x1b[31m",`\n🚨 OverrideAction of ManagedRuleGroup ${source} is set to COUNT, which simply tallies all rules within the group.\n However, this practice may create a vulnerability in your firewall and is not recommended.\n\n`,"\x1b[0m");
      break;
    case "noManageRuleGroups":
      console.log("\x1b[31m","\n🚨 No ManagedRuleGroups are used in your Firewall.\n More about ManagedRuleGroups: https://docs.aws.amazon.com/waf/latest/developerguide/waf-managed-rule-groups.html.\n\n","\x1b[0m");
      break;
    case "deploymentHash":
      console.log("\x1b[31m","   ⚠️   Legacy functionality ⌛️ \n This functionality will be removed soon. \n\n","\x1b[0m");
      break;
    case "byteMatchStatementPositionalConstraint":
      console.log("\x1b[31m",`\n🚨 Found PositionalConstraint "${source}" in ByteMatchStatement - It is cheaper from WCU perspektive to use a RegexMatchStatement in this Case.\n\n`,"\x1b[0m");
      break;
    default:
      break;
  }
}