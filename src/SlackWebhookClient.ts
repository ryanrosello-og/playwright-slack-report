import { Block, KnownBlock } from '@slack/types';
import { IncomingWebhook, IncomingWebhookResult } from '@slack/webhook';
import { SummaryResults } from '.';
import { generateBlocks } from './LayoutGenerator';

export default class SlackWebhookClient {
  private webhook: IncomingWebhook;

  constructor(webhook: IncomingWebhook) {
    this.webhook = webhook;
  }

  async sendMessage({
    customLayout,
    customLayoutAsync,
    maxNumberOfFailures,
    summaryResults,
    disableUnfurl,
  }: {
    customLayout: Function | undefined;
    customLayoutAsync: Function | undefined;
    maxNumberOfFailures: number;
    summaryResults: SummaryResults;
    disableUnfurl: boolean;
  }): Promise<{ outcome: string }> {
    let blocks: (Block | KnownBlock)[];
    if (customLayout) {
      blocks = customLayout(summaryResults);
    } else if (customLayoutAsync) {
      blocks = await customLayoutAsync(summaryResults);
    } else {
      blocks = await generateBlocks(summaryResults, maxNumberOfFailures);
    }
    let result: IncomingWebhookResult;
    try {
      result = await this.webhook.send({
        blocks,
        unfurl_links: !disableUnfurl,
      });
    } catch (error) {
      return {
        outcome: `error: ${JSON.stringify(error, null, 2)}`,
      };
    }
    if (result && result.text === 'ok') {
      return {
        outcome: result.text,
      };
    }
    return {
      outcome:
        '😵 Failed to send webhook message, ensure your webhook url is valid',
    };
  }
}
