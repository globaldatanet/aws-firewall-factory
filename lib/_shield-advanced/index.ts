/** 
 * @packageDocumentation
 * # AWS Firewall Factory - Shield Advanced Stack
 * 
 * The Shield Advanced Stack deploy Shield Advanced Policies using Firewall Manager.
 * 
 * @example
 * import { shield } from "../../lib/types/config";
* export const shieldConfig: shield.config = {
*  General: {
*    Prefix: "aws-firewall-factory",
*    Stage: "test",
*    S3LoggingBucketName: "aws-waf-logs-aws-firewall-factory-test",
*    LoggingConfiguration: "S3",
*    SecuredDomain: ["test.aws-firewall-factory.com"],
*    CreateDashboard: true,
*  },
*  WebAcl: { OverrideCustomerWebACLAssociation: false },
*  defaultActionType:"ALLOW",
*  remediationEnabled: true,
*  resourceType: "AWS::ElasticLoadBalancing::LoadBalancer",
*  policyName: "ACS-FIREWALL-FACTORY-SHIELD-ADVANCED",
*  includeMap: { account: ["123456189012"] },
*  excludeMap: {},
*  excludeResourceTags: false,
* };
 */

export * from "./stack";