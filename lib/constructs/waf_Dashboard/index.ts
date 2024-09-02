/** 
 * @packageDocumentation
 * # AWS Firewall Factory - WAF CloudWatch Dashboard
 * 
 * This Contruct deploy WAF CloudWatch Dashboard.
 * ![FirewallDashboard](../assets/waf_Dashboard.jpg)
 *  ## The Dashboard shows:
    - Where the WAF is deployed to [AWS Region and Account(s)]
    - Which resource type you are securing
    - Which Managed Rule Groups in which version are in use
    - Link to Managed Rule Groups documentation
    - Direct Link to your secured Application / Endpoint
    - AWS Firewall Factory version
    - Check if the AWS Firewall Factory version is the latest or not during rollout
    - Allowed / Blocked and Counted Requests
    - Bot vs Non-bot Requests
 */

export * from "./dashboard";