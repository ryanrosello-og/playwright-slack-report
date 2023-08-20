import { Block, KnownBlock } from '@slack/types';
import { IncomingWebhook } from '@slack/webhook';
import { SummaryResults } from '.';
import { generateBlocks, generateFailures } from './LayoutGenerator';

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
    showInThread,
    disableUnfurl,
  }: {
    customLayout: Function | undefined;
    customLayoutAsync: Function | undefined;
    maxNumberOfFailures: number;
    summaryResults: SummaryResults;
    showInThread: boolean;
    disableUnfurl: boolean;
  }): Promise<{ outcome: string; ts: string }> {
    let blocks: (Block | KnownBlock)[];
    if (customLayout) {
      blocks = customLayout(summaryResults);
    } else if (customLayoutAsync) {
      blocks = await customLayoutAsync(summaryResults);
    } else if (showInThread) {
      const modifiedOptions = JSON.parse(JSON.stringify(summaryResults));
      modifiedOptions.failures = [];
      blocks = await generateBlocks(modifiedOptions, maxNumberOfFailures);
    } else {
      blocks = await generateBlocks(summaryResults, maxNumberOfFailures);
    }

    const result = await this.webhook.send({
      blocks,
      unfurl_links: !disableUnfurl,
    });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result));
    // TODO: debug this result
    // text: response.data  << parse it and find ts
    return {
      outcome: result.text,
      ts: '22',
    };
  }

  async attachDetailsToThread({
    ts,
    summaryResults,
    maxNumberOfFailures,
    disableUnfurl,
  }: {
    ts: string;
    summaryResults: SummaryResults;
    maxNumberOfFailures: number;
    disableUnfurl?: boolean;
    fakeRequest?: Function;
  }) {
    const blocks = await generateFailures(summaryResults, maxNumberOfFailures);
    const attachments = [
      {
        blocks,
        ts,
      },
    ];
    const result = await this.webhook.send({
      attachments,
      unfurl_links: !disableUnfurl,
    });
    return result;
  }
}
