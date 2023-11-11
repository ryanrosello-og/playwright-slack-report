/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import {
  WebClient,
  KnownBlock,
  Block,
  ChatPostMessageResponse,
  LogLevel,
} from '@slack/web-api';
import { SummaryResults } from '.';
import { generateBlocks, generateFailures, generateFallbackText } from './LayoutGenerator';

export type additionalInfo = Array<{ key: string; value: string }>;

export default class SlackClient {
  private slackWebClient: WebClient;

  constructor(slackClient: WebClient) {
    this.slackWebClient = slackClient;
  }

  async sendMessage({
    options,
  }: {
    options: {
      channelIds: Array<string>;
      customLayout: Function | undefined;
      customLayoutAsync: Function | undefined;
      fakeRequest?: Function;
      maxNumberOfFailures: number;
      slackOAuthToken?: string;
      slackLogLevel?: LogLevel;
      disableUnfurl?: boolean;
      summaryResults: SummaryResults;
      showInThread: boolean;
    };
  }): Promise<Array<{ channel: string; outcome: string; ts: string }>> {
    let blocks: (Block | KnownBlock)[];
    if (options.customLayout) {
      blocks = options.customLayout(options.summaryResults);
    } else if (options.customLayoutAsync) {
      blocks = await options.customLayoutAsync(options.summaryResults);
    } else if (options.showInThread) {
      const modifiedOptions = JSON.parse(JSON.stringify(options));
      modifiedOptions.summaryResults.failures = [];
      blocks = await generateBlocks(
        modifiedOptions.summaryResults,
        options.maxNumberOfFailures,
      );
    } else {
      blocks = await generateBlocks(
        options.summaryResults,
        options.maxNumberOfFailures,
      );
    }
    if (!options.channelIds) {
      throw new Error(`Channel ids [${options.channelIds}] is not valid`);
    }
    const fallbackText = generateFallbackText(options.summaryResults);
    const result = [];
    const unfurl: boolean = !options.disableUnfurl;
    for (const channel of options.channelIds) {
      let chatResponse: ChatPostMessageResponse;
      try {
        // under test
        if (options.fakeRequest) {
          chatResponse = await options.fakeRequest();
        } else {
          // send request for reals
          chatResponse = await SlackClient.doPostRequest(
            this.slackWebClient,
            channel,
            fallbackText,
            blocks,
            unfurl,
          );
        }
        if (chatResponse.ok) {
          result.push({
            channel,
            outcome: `✅ Message sent to ${channel}`,
            ts: chatResponse.ts,
          });
          // eslint-disable-next-line no-console
          console.log(`✅ Message sent to ${channel}`);
        } else {
          result.push({
            channel,
            outcome: `❌ Message not sent to ${channel} \r\n ${JSON.stringify(
              chatResponse,
              null,
              2,
            )}`,
          });
        }
      } catch (error: any) {
        result.push({
          channel,
          outcome: `❌ Message not sent to ${channel} \r\n ${error.message}`,
        });
      }
    }
    return result;
  }

  async attachDetailsToThread({
    channelIds,
    ts,
    summaryResults,
    maxNumberOfFailures,
    disableUnfurl,
    fakeRequest,
  }: {
    channelIds: Array<string>;
    ts: string;
    summaryResults: SummaryResults;
    maxNumberOfFailures: number;
    disableUnfurl?: boolean;
    fakeRequest?: Function;
  }) {
    const result = [];
    const blocks = await generateFailures(summaryResults, maxNumberOfFailures);
    const fallbackText = generateFallbackText(summaryResults);
    for (const channel of channelIds) {
      // under test
      let chatResponse: ChatPostMessageResponse;
      if (fakeRequest) {
        chatResponse = await fakeRequest();
      } else {
        chatResponse = await SlackClient.doPostRequest(
          this.slackWebClient,
          channel,
          fallbackText,
          blocks,
          disableUnfurl,
          ts,
        );
      }
      if (chatResponse.ok) {
        // eslint-disable-next-line no-console
        console.log(`✅ Message sent to ${channel} within thread ${ts}`);
        result.push({
          channel,
          outcome: `✅ Message sent to ${channel} within thread ${ts}`,
          ts: chatResponse.ts,
        });
      }
    }
    return result;
  }

  static async doPostRequest(
    slackWebClient: WebClient,
    channel: string,
    fallbackText: string,
    blocks: Array<KnownBlock | Block>,
    unfurl: boolean,
    threadTimestamp?: string,
  ): Promise<ChatPostMessageResponse> {
    const chatResponse = await slackWebClient.chat.postMessage({
      channel,
      text: fallbackText,
      unfurl_link: unfurl,
      blocks,
      thread_ts: threadTimestamp,
    });
    return chatResponse;
  }
}
