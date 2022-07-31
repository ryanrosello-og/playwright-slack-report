/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import {
  WebClient, LogLevel, KnownBlock, Block,
} from '@slack/web-api';

export type testSummary = {
  passed: number;
  failed: number;
  skipped: number;
  aborted: number;
  failures: Array<failure>;
  meta?: additionalInfo;
};

export type failure = {
  test: string;
  failureReason: string;
};

export type additionalInfo = Array<{ key: string, value: string }>

export default class SlackClient {
  private slackClient: WebClient;

  constructor() {
    if (!process.env.SLACK_BOT_USER_OAUTH_TOKEN) {
      throw new Error('SLACK_BOT_USER_OAUTH_TOKEN was not found');
    }
    this.slackClient = new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
      logLevel: LogLevel.DEBUG,
    });
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
      const {
        failureReason,
        test,
      } = summaryResults.failures[i];
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
        meta.push(
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\n*${key}* :\t${value}`,
            },
          },
        );
      }
    }

    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: *${summaryResults.passed
          }* Tests ran successfully \n\n :red_circle: *${summaryResults.failed
          }* Tests failed \n\n ${summaryResults.skipped > 0
            ? `:fast_forward: *${summaryResults.skipped}* skipped`
            : ''
          } \n\n ${summaryResults.aborted > 0
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
    channelIds: Array<string>,
    summaryResults: testSummary,
    customLayout: Function | undefined,
  }) {
    let blocks;
    if (options.customLayout) {
      blocks = options.customLayout(options.summaryResults);
    } else {
      blocks = await this.generateBlocks(options.summaryResults);
    }
    if (!options.channelIds) {
      throw new Error(`Channel ids [${options.channelIds}] is not valid`);
    }

    for (const channel of options.channelIds) {
      let chatResponse;
      try {
        chatResponse = await this.slackClient.chat.postMessage({
          channel,
          text: ' ',
          blocks,
        });
        if (chatResponse.ok) {
          // eslint-disable-next-line no-console
          console.log(`✅ Message sent to ${channel}`);
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      }
    }
  }
}
