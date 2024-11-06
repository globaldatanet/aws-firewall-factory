/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { IncomingWebhook } from "./IncomingWebhook";
import { SNSEventRecord } from "aws-lambda";

import * as AdaptiveCards from "adaptivecards";

export async function mangedRuleGroupNotificationTeams(CurrentDefaultVersion: string, WafRuleGroupInfoText:string, Record: SNSEventRecord, Webhook: string) {
  const webhook = new IncomingWebhook(Webhook);
  const cardfacts: AdaptiveCards.Fact[] = [];
  cardfacts.push(new AdaptiveCards.Fact("Managed Rule Group", Record.Sns.MessageAttributes.managed_rule_group.Value));
  cardfacts.push(new AdaptiveCards.Fact("Current Default Version", CurrentDefaultVersion));

  const card = new AdaptiveCards.AdaptiveCard();
  card.version = AdaptiveCards.Versions.v1_5;
  card.height = "stretch";

  const subjectblock = new AdaptiveCards.TextBlock();
  subjectblock.text = Record.Sns.Subject || "Managed Rule Group Notification";
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

  const facts = new AdaptiveCards.FactSet();
  facts.facts = cardfacts;
  card.addItem(facts);

  const InfoTextBlock = new AdaptiveCards.TextBlock();
  InfoTextBlock.text = WafRuleGroupInfoText;
  InfoTextBlock.weight = AdaptiveCards.TextWeight.Default;
  InfoTextBlock.wrap = true;
  InfoTextBlock.separator = true;
  card.addItem(InfoTextBlock);

  const response = await webhook.send(card);
  console.log("ℹ️ Teams Notification reponse-Code: " + response?.status);
}