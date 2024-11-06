/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { IncomingWebhook } from "./IncomingWebhook";
import { SNSEventRecord } from "aws-lambda";

import * as AdaptiveCards from "adaptivecards";

export async function ddosNotificationTeams(Record: SNSEventRecord, Webhook: string) {
  const webhook = new IncomingWebhook(Webhook);
  const card = new AdaptiveCards.AdaptiveCard();
  card.version = AdaptiveCards.Versions.v1_5;
  card.height = "stretch";

  const subjectblock = new AdaptiveCards.TextBlock();
  subjectblock.text = Record.Sns.Subject || "DDoS Notification";
  subjectblock.wrap = true;
  subjectblock.weight = AdaptiveCards.TextWeight.Bolder;
  subjectblock.size = AdaptiveCards.TextSize.Large;
  subjectblock.separator = true;
  card.addItem(subjectblock);

  const messageBlock = new AdaptiveCards.TextBlock();
  messageBlock.text = Record.Sns.Message;
  messageBlock.weight = AdaptiveCards.TextWeight.Default;
  messageBlock.wrap = true;
  card.addItem(messageBlock);


  const response = await webhook.send(card);
  console.log("ℹ️ Teams Notification reponse-Code: " + response?.status);
}