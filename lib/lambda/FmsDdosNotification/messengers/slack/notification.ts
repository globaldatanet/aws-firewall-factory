import { IncomingWebhook } from "@slack/webhook";
import { MessageAttachment } from "@slack/types";
import { SNSEventRecord } from "aws-lambda";

export async function ddosNotificationSlack(Record: SNSEventRecord, Webhook: string) {
  const url = Webhook;
  const attachments: MessageAttachment[] = [
    {
      fallback: `Detailed information on ${Record.Sns.Subject}.`,
      color: "danger",
      title: `🚨 Alert: ${Record.Sns.Subject}`,
      text: `${Record.Sns.Message}`,
      mrkdwn_in: ["text", "pretext"],
    }
  ];
  

  const webhook = new IncomingWebhook(url);
  const payload = {
    username: `WAF ${Record.Sns.Type}`,
    icon_emoji: ":managedrule:",
    text: "*DDoS Alert Notification*",
    attachments: attachments
  };

  console.log("webhook payload is " + JSON.stringify(payload));

  const response = await webhook.send(payload);
  console.log("response is " + JSON.stringify(response));
  console.log("ℹ️ Slack Notification response-Code: " + response?.text);
}