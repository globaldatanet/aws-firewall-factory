import { IncomingWebhook } from "@slack/webhook";
import { MessageAttachment } from "@slack/types";
import { SNSEventRecord } from "aws-lambda";
const url = process.env.WEBHOOK_URL;

export async function mangedRuleGroupNotificationSlack(CurrentDefaultVersion: string, WafRuleGroupInfoText:string, Record: SNSEventRecord) {
  if (url !== undefined) {

    const attachments: MessageAttachment ={
      "fallback": `Detailed information on ${Record.Sns.Type}.`,
      "color": "green",
      "title": Record.Sns.Subject,
      "text": Record.Sns.Message,
      fields: [
        {
          "title": "Managed Rule Group",
          "value": Record.Sns.MessageAttributes.managed_rule_group.Value,
          "short": true
        },
        {
          "title": "Default Version",
          "value": CurrentDefaultVersion,
          "short": true
        },
        {
          "title": "Info",
          "value": WafRuleGroupInfoText,
          "short": false
        }
      ]
    };
    const webhook = new IncomingWebhook(url,
      {
        "username": `WAF ${Record.Sns.Type}`,
        "icon_emoji": ":managedrule:",
        "text": Record.Sns.Subject,
      });
    const response = await webhook.send(attachments);
    console.log("ℹ️ Slack Notification reponse-Code: " + response?.text);
  }
}
