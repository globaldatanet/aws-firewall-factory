import { SNSEvent } from "aws-lambda";
import { ddosNotificationTeams } from "./messengers/teams/notification";
import { ddosNotificationSlack } from "./messengers/slack/notification";
import { getWebhook } from "../SharedComponents/services/secretsmanager";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
export async function handler(Event: SNSEvent) {
  console.log("Lambda is invoked with:" + JSON.stringify(Event));

  for (const record of Event.Records) {
    const WebhookSecret = await getWebhook(WEBHOOK_SECRET);
    switch (WebhookSecret.Messenger) {
      case "Slack":
        await ddosNotificationSlack(record, WebhookSecret.WebhookUrl);
        break;
      case "Teams":
        await ddosNotificationTeams(record, WebhookSecret.WebhookUrl);
        break;
    }
  }
}
