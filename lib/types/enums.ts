/**
 * These typescript enums used in aws firewall manager
 *
 * @see https://www.typescriptlang.org/docs/handbook/enums.html
 * @see https://aws.amazon.com/en/firewall-manager/
 */

/**
 * Specifies whether this is for an Amazon CloudFront distribution or for a regional application.
 * A regional application can be
 * - an Application Load Balancer (ALB),
 * - an Amazon API Gateway REST API,
 * - an AWS AppSync GraphQL API,
 * - an Amazon Cognito user pool,
 * - an AWS App Runner service,
 * - or an AWS Verified Access instance.
 *
 * Valid Values are CLOUDFRONT and REGIONAL.
 *
 * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-wafv2-webacl.html
 */
export enum WebAclScope {
  CLOUDFRONT = "CLOUDFRONT",
  REGIONAL = "REGIONAL"
}

/**
 * List of REGIONAL AWS Managed Rule Groups
 * @see  https://docs.aws.amazon.com/waf/latest/APIReference/API_ListAvailableManagedRuleGroups.html
 * @see https://docs.aws.amazon.com/cli/latest/reference/wafv2/list-available-managed-rule-groups.html
 * SDK command:
 * Regional:
 *  aws wafv2 list-available-managed-rule-groups --scope REGIONAL |jq -r ".[] | .[] | .Name"
 * Cloudfront
 *  aws wafv2 list-available-managed-rule-groups --scope REGIONAL --region=us-east-1|jq -r ".[] | .[] | .Name"
 */
export enum AwsManagedRules {
  COMMON_RULE_SET = "AWSManagedRulesCommonRuleSet",
  ADMIN_PROTECTION_RULE_SET = "AWSManagedRulesAdminProtectionRuleSet",
  KNOWN_BAD_INPUTS_RULE_SET = "AWSManagedRulesKnownBadInputsRuleSet",
  SQLI_RULE_SET = "AWSManagedRulesSQLiRuleSet",
  LINUX_RULE_SET = "AWSManagedRulesLinuxRuleSet",
  UNIX_RULE_SET = "AWSManagedRulesUnixRuleSet",
  WINDOWS_RULE_SET = "AWSManagedRulesWindowsRuleSet",
  PHP_RULE_SET = "AWSManagedRulesPHPRuleSet",
  WORDPRESS_RULE_SET = "AWSManagedRulesWordPressRuleSet",
  AMAZON_IP_REPUTATION_LIST = "AWSManagedRulesAmazonIpReputationList",
  ANONYMOUS_IP_LIST = "AWSManagedRulesAnonymousIpList",
  BOT_CONTROL_RULE_SET = "AWSManagedRulesBotControlRuleSet",
  ATP_RULE_SET = "AWSManagedRulesATPRuleSet",
  ACFP_RULE_SET = "AWSManagedRulesACFPRuleSet"
}

/**
 * AWS Managed roule Group Vendor
 */
export enum ManagedRuleGroupVendor {
  AWS = "AWS"
}

/**
 * AWS WAF Content Type
 *
 * The type of content in the payload that you are defining in the Content string.
 *
 * @see https://docs.aws.amazon.com/waf/latest/APIReference/API_CustomResponseBody.html
 */
export enum CustomResponseBodiesContentType {
  APPLICATION_JSON = "APPLICATION_JSON",
  TEXT_HTML = "TEXT_HTML",
  TEXT_PLAIN = "TEXT_PLAIN",
}

/**
 * enum for supporte webacl types
 * following types are waiting for support if you need a GraphQLApi Firewall just use an ApiGateway:Stage Firewall
 *  - "AWS::Cognito::UserPool"
 *  - "AWS::AppSync::GraphQLApi"
 */
export enum WebAclTypeEnum {
  ELASTICLOADBALANCINGV2_LOADBALANCER = "AWS::ElasticLoadBalancingV2::LoadBalancer",
  CLOUDFRONT_DISTRIBUTION = "AWS::CloudFront::Distribution",
  APIGATEWAYV2_API = "AWS::ApiGatewayV2::Api",
  APIGATEWAY_STAGE = "AWS::ApiGateway::Stage",
  COGNITO_USERPOOL = "AWS::Cognito::UserPool",
  APPSYNC_GRAPHQLAPI  = "AWS::AppSync::GraphQLApi"
}