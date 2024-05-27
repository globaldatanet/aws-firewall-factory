import { IncomingWebhook } from "@slack/webhook";
import { MessageAttachment } from "@slack/types";
import { SNSEventRecord } from "aws-lambda";

export async function ddosNotificationSlack(Record: SNSEventRecord, Webhook: string) {
  const url = Webhook;
  const attachments: MessageAttachment ={
    "fallback": `Detailed information on ${Record.Sns.Type}.`,
    "color": "green",
    "title": Record.Sns.Subject,
    "text": Record.Sns.Message,
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
