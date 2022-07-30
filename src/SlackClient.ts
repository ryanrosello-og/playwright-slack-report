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

  async sendMessage(
    channelIds: Array<string>,
    summaryResults: testSummary,
  ) {
    const maxNumberOfFailures = 10;
    const maxNumberOfFailureLength = 650;
    const fails = [];
    if (!channelIds) {
      throw new Error(`Channel ids [${channelIds}] is not valid`);
    }

    for (const channelId of channelIds) {
      const slackChannel = channelId?.toString();

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
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Environment:*\n${summaryResults.environment}`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `\n${summaryResults.build}`,
              },
            },
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
