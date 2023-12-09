import { expect, test } from '@playwright/test';
import { LogLevel } from '@slack/web-api';

test.describe('CLI app - send result', () => {
  // Attaches details to thread if config specifies to show in thread and there are failures
  // test('should attach details to thread if config specifies to show in thread and there are failures', async () => {
  //   const resultSummary = {
  //     failures: [{ id: 'failure1' }, { id: 'failure2' }],
  //   };
  //   const slackClient = {
  //     sendMessage: jest.fn().mockResolvedValue([
  //       { channel: 'channel1', ts: 'ts1' },
  //       { channel: 'channel2', ts: 'ts2' },
  //     ]),
  //     attachDetailsToThread: jest.fn().mockResolvedValue(true),
  //   };
  //   const config = {
  //     slackLogLevel: LogLevel.DEBUG,
  //     sendResults: 'on-failure',
  //     sendUsingBot: {
  //       channels: [{ id: 'channel1' }, { id: 'channel2' }],
  //     },
  //     showInThread: true,
  //   };

  //   await sendResultsUsingBot({ resultSummary, slackClient, config });

  //   expect(slackClient.attachDetailsToThread).toHaveBeenCalledWith({
  //     channelIds: ['channel1', 'channel2'],
  //     ts: 'ts1',
  //     summaryResults: resultSummary,
  //     maxNumberOfFailures: undefined,
  //   });
  //   expect(slackClient.attachDetailsToThread).toHaveBeenCalledWith({
  //     channelIds: ['channel1', 'channel2'],
  //     ts: 'ts2',
  //     summaryResults: resultSummary,
  //     maxNumberOfFailures: undefined,
  //   });
  // });
  test('throws an error when the JSON results file does not exist', async ({}) => {
    //
  });
  test('throws an error when the config file does not exist', async ({}) => {
    //
  });
  test('throws an error when both sendUsingWebhook and sendUsingBot are defined', async ({}) => {
    //
  });
  test('ensures the env variable [SLACK_BOT_USER_OAUTH_TOKEN] is set', async ({}) => {
    //
  });
  test('ensures the webhook ulr is specified', async ({}) => {
    //
  });
  test('ensures the customLayout settings are correct', async ({}) => {
    //
  });
  test('ensures the customLayoutAsync settings are correct', async ({}) => {
    //
  });
});
