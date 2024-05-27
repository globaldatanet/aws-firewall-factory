import axios, { AxiosInstance, AxiosResponse } from "axios";
import * as AdaptiveCards from "adaptivecards";
import { IncomingWebhookResult } from "./types";
/**
 * A client for Teams Incoming Webhooks
 */
export class IncomingWebhook {

  /**
   * The webhook URL
   */
  private url: string;


  /**
   * Axios HTTP client instance used by this client
   */
  private axios: AxiosInstance;

  constructor(url?: string) {
    if (url === undefined) {
      throw new Error("Incoming webhook URL is required");
    }

    this.url = url;

    this.axios = axios.create({
      baseURL: url,
      maxRedirects: 3,
      proxy: false
    });
  }

  /**
   * Send a notification to a conversation
   * @param message currently support for Messagecard https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using?tabs=cURL
   */
  public async send(card: AdaptiveCards.AdaptiveCard): Promise<IncomingWebhookResult | undefined> {
    // NOTE: no support for TLS config
    const mycard = card.toJSON();
    
    const payload = { "type":"message",
      "attachments":[
        { "contentType":"application/vnd.microsoft.card.adaptive",
          "contentUrl": "",
          "content": {
            ...mycard, "msteams": { "width": "Full" }
          }}
      ]};
    const response = await this.axios.post(this.url,payload);
    return this.buildResult(response);
  }
  /**
   *
   * Processes an HTTP response into an IncomingWebhookResult.
   */
  private buildResult(response: AxiosResponse): IncomingWebhookResult {
    return {
      status: response.status,
    };
  }
}