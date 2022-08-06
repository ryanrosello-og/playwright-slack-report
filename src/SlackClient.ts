/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import {
  WebClient,
  LogLevel,
  KnownBlock,
  Block,
  ChatPostMessageResponse,
} from '@slack/web-api';
import { testResult } from './ResultsParser';

export type testSummary = {
  passed: number;
  failed: number;
  skipped: number;
  aborted: number;
  failures: Array<failure>;
  meta?: additionalInfo;
  tests: Array<testResult>;
};

export type failure = {
  test: string;
  failureReason: string;
};

export type additionalInfo = Array<{ key: string; value: string }>;

export default class SlackClient {
  private slackWebClient: WebClient;

  constructor(slackClient: WebClient) {
    this.slackWebClient = slackClient;
  }

  // eslint-disable-next-line class-methods-use-this
  async generateBlocks(
    summaryResults: testSummary,
  ): Promise<Array<KnownBlock | Block>> {
    const maxNumberOfFailures = 10;
    const maxNumberOfFailureLength = 650;
    const fails = [];
    const meta = [];

    for (let i = 0; i < summaryResults.failures.length; i += 1) {
      const { failureReason, test } = summaryResults.failures[i];
      const formattedFailure = failureReason
        .substring(0, maxNumberOfFailureLength)
        .split('\n')
        .map((l) => `>${l}`)
        .join('\n');
      fails.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${test}*
          \n\n${formattedFailure}`,
        },
      });
      if (i > maxNumberOfFailures) {
        fails.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*There are too many failures to display, view the full results in BuildKite*',
          },
        });
        break;
      }
    }

    if (summaryResults.meta) {
      for (let i = 0; i < summaryResults.meta.length; i += 1) {
        const { key, value } = summaryResults.meta[i];
        meta.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\n*${key}* :\t${value}`,
          },
        });
      }
    }

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: *${
            summaryResults.passed
          }* Tests ran successfully \n\n :red_circle: *${
            summaryResults.failed
          }* Tests failed \n\n ${
            summaryResults.skipped > 0
              ? `:fast_forward: *${summaryResults.skipped}* skipped`
              : ''
          } \n\n ${
            summaryResults.aborted > 0
              ? `:exclamation: *${summaryResults.aborted}* aborted`
              : ''
          }`,
        },
      },
      ...meta,
      {
        type: 'divider',
      },
      ...fails,
    ];
  }

  async sendMessage(options: {
    channelIds: Array<string>;
    summaryResults: testSummary;
    customLayout: Function | undefined;
    fakeRequest?: Function;
  }): Promise<Array<{ channel: string; outcome: string }>> {
    let blocks;
    if (options.customLayout) {
      blocks = options.customLayout(options.summaryResults);
    } else {
      blocks = await this.generateBlocks(options.summaryResults);
    }
    if (!options.channelIds) {
      throw new Error(`Channel ids [${options.channelIds}] is not valid`);
    }

    let result = [];
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
    blocks: never[],
  ): Promise<ChatPostMessageResponse> {
    let chatResponse = await this.slackWebClient.chat.postMessage({
      channel,
      text: ' ',
      blocks,
    });
    return chatResponse;
  }
}
