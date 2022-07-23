/* eslint-disable import/no-extraneous-dependencies */
import { WebClient, LogLevel } from '@slack/web-api';

export type testSummary = {
  build: string;
  environment: string;
  passed: number;
  failed: number;
  skipped: number;
  aborted: number;
  duration: string;
  failures: {
    resultLink: string;
    test: string;
    failureReason: string;
    mostRecentOccurrenceOfFailure: string;
    countOfTestFailureEncounters: string;
    last10Results: string;
  }[];
};

export default class SlackReporter {
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
    channelId: string | undefined,
    summaryResults: testSummary,
  ) {
    const maxNumberOfFailures = 10;
    const maxNumberOfFailureLength = 650;
    const fails = [];
    if (!channelId) {
      throw new Error(`Channel id [${channelId}] is not valid`);
    }
    const slackChannel = channelId.toString();

    for (let i = 0; i < summaryResults.failures.length; i += 1) {
      const {
        failureReason,
        resultLink,
        last10Results,
        mostRecentOccurrenceOfFailure,
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
          text: `*${test}* <${resultLink}|:information_source:>
          \n${last10Results}\n${mostRecentOccurrenceOfFailure}\n\n${formattedFailure}`,
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

    await this.slackClient.chat.postMessage({
      channel: slackChannel,
      text: ' ',
      blocks: [
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
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Environment:*\n${summaryResults.environment}`,
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${summaryResults.duration}`,
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
  }
}
