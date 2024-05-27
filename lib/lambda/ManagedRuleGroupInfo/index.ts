import { SNSEvent } from "aws-lambda";
import { getManagedRuleGroupVersions } from "../SharedComponents/services/waf";
import {mangedRuleGroupNotificationTeams} from "./messengers/teams/notification";
import {mangedRuleGroupNotificationSlack} from "./messengers/slack/notification";
import { getWebhook } from "../SharedComponents/services/secretsmanager";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const WAFRULEGROUPINFOTEXT = "AWS WAF always sets the default version to the static version that's currently recommended by the provider. When the provider updates their recommended static version, AWS WAF automatically updates the default version setting for the rule group in your web ACL.";

export async function handler(Event: SNSEvent){
  console.log("Lambda is invoked with:" + JSON.stringify(Event));
  const WebhookSecret = await getWebhook(WEBHOOK_SECRET);
  for(const record of Event.Records){
    const versions = await getManagedRuleGroupVersions("AWS", record.Sns.MessageAttributes.managed_rule_group.Value, "REGIONAL");
    const CurrentDefaultVersion = versions.CurrentDefaultVersion;
    switch(WebhookSecret.Messenger){
      case "Slack":
        await mangedRuleGroupNotificationSlack(CurrentDefaultVersion, WAFRULEGROUPINFOTEXT, record, WebhookSecret.WebhookUrl);
        break;
      case "Teams":
        await mangedRuleGroupNotificationTeams(CurrentDefaultVersion, WAFRULEGROUPINFOTEXT, record, WebhookSecret.WebhookUrl);
        break;
    }
  }
}