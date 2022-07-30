/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import { WebClient, LogLevel } from '@slack/web-api';

export type testSummary = {
  build: string;
  environment: string;
  passed: number;
  failed: number;
  skipped: number;
  aborted: number;
  // eslint-disable-next-line no-use-before-define
  failures: Array<failure>;
};

export type failure = {
  test: string;
  failureReason: string;
};

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

  async sendMessage(options: {
    channelIds: Array<string>,
    summaryResults: testSummary,
    meta: Array<{ key: string, value: string }>,
  }) {
    const maxNumberOfFailures = 10;
    const maxNumberOfFailureLength = 650;
    const fails = [];
    const meta = [];
    if (!options.channelIds) {
      throw new Error(`Channel ids [${options.channelIds}] is not valid`);
    }

    for (const channelId of options.channelIds) {
      const slackChannel = channelId?.toString();

      for (let i = 0; i < options.summaryResults.failures.length; i += 1) {
        const {
          failureReason,
          test,
        } = options.summaryResults.failures[i];
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

      for (let i = 0; i < options.meta.length; i += 1) {
        const { key, value } = options.meta[i];
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

      let chatResponse;
      try {
        chatResponse = await this.slackClient.chat.postMessage({
          channel: slackChannel,
          text: ' ',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `:white_check_mark: *${options.summaryResults.passed
                }* Tests ran successfully \n\n :red_circle: *${options.summaryResults.failed
                }* Tests failed \n\n ${options.summaryResults.skipped > 0
                  ? `:fast_forward: *${options.summaryResults.skipped}* skipped`
                  : ''
                } \n\n ${options.summaryResults.aborted > 0
                  ? `:exclamation: *${options.summaryResults.aborted}* aborted`
                  : ''
                }`,
              },
            },
            ...meta,
            {
              type: 'divider',
            },
            ...fails,
          ],
        });
        if (chatResponse.ok) {
          // eslint-disable-next-line no-console
          console.log(`✅ Message sent to ${slackChannel}`);
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error.message);
      }
    }
  }
}
