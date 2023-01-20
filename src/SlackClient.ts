/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import {
  WebClient,
  KnownBlock,
  Block,
  ChatPostMessageResponse,
} from '@slack/web-api';
import { SummaryResults } from '.';
import generateBlocks from './LayoutGenerator';

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
      summaryResults: SummaryResults;
      customLayout?: (summaryResults: SummaryResults) => Array<KnownBlock | Block>;
      customLayoutAsync?: (summaryResults: SummaryResults) => Promise<Array<KnownBlock | Block>>;
      fakeRequest?: Function;
      maxNumberOfFailures: number;
    };
  }): Promise<Array<{ channel: string; outcome: string }>> {
    let blocks: (Block | KnownBlock)[];
    if (options.customLayout) {
      blocks = options.customLayout(options.summaryResults);
    } else if (options.customLayoutAsync) {
      blocks = await options.customLayoutAsync(options.summaryResults);
    } else {
      blocks = await generateBlocks(options.summaryResults, options.maxNumberOfFailures);
    }
    if (!options.channelIds) {
      throw new Error(`Channel ids [${options.channelIds}] is not valid`);
    }

    const result = [];
    for (const channel of options.channelIds) {
      let chatResponse: ChatPostMessageResponse;
      try {
        // under test
        if (options.fakeRequest) {
          chatResponse = await options.fakeRequest();
        } else {
          // send request for reals
          chatResponse = await this.doPostRequest(channel, blocks);
        }
        if (chatResponse.ok) {
          result.push({ channel, outcome: `✅ Message sent to ${channel}` });
          // eslint-disable-next-line no-console
          console.log(`✅ Message sent to ${channel}`);
        } else {
          result.push({ channel, outcome: `❌ Message not sent to ${channel} \r\n ${JSON.stringify(chatResponse, null, 2)}` });
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

  async doPostRequest(
    channel: string,
    blocks: Array<KnownBlock | Block>,
  ): Promise<ChatPostMessageResponse> {
    const chatResponse = await this.slackWebClient.chat.postMessage({
      channel,
      text: ' ',
      blocks,
    });
    return chatResponse;
  }
}
