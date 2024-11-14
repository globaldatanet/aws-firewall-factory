/** 
 * @packageDocumentation
 * # AWS Firewall Factory - Prerequisites Stack
 *
 * The Prequisites Stack is used to deploy the prerequisites for the AWS Firewall Factory.
 * 
 * It contains the following resources:
 *  - S3 Bucket for Logging
 *  - KMS Key for Encryption
 *  - Lambda Function for Notifications for Managed RuleGroup Updates
 *  - Lambda Function for Notifications for DDoS (Advanced Shield)
 *  - Lambda Function for Notifications for Unused WAF (WebACL)
 * @description
 * 
 * @example
 * import { prerquisites } from "../../lib/types/config";
 * export const prequisites: prerquisites.config = {
 *  General: {
 *    Prefix: "aws-firewall-factory",
 *  },
 *  Logging: {
 *    BucketProperties: {
 *      BucketName: "aws-firewall-factory-logs",
 *      KmsEncryptionKey: true,
 *      ObjectLock: {
 *        Days: 5,
 *        Mode: "GOVERNANCE"
 *      }
 *    },
 *    FireHoseKey: {
 *      KeyAlias: "aws-firewall-factory-firehosekey"
 *    },
 *    CrossAccountIdforPermissions: "123456789012",
 *  },
 *  DdosNotifications:{WebhookSopsFile: "./values/examples/webhooks/slack.json"}
 * };
 */
export * from "./stack";