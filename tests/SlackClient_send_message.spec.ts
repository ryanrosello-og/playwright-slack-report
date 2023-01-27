import { expect } from '@playwright/test';
import { ChatPostMessageResponse } from '@slack/web-api';
import generateCustomLayout from '../src/custom_block/my_block';
import { test } from './fixtures';

test.describe('SlackClient.sendMessage()', () => {
  test('sends message using default block layout', async ({
    testSlackClient,
    testSummaryAllTestsPassed,
  }) => {
    const fakeRequest = async (): Promise<ChatPostMessageResponse> => ({
      ok: true,
    });
    const channelId = 'C12345';
    const clientResponse = await testSlackClient.sendMessage({
      options: {
        channelIds: [channelId],
        summaryResults: testSummaryAllTestsPassed,
        customLayout: undefined,
        customLayoutAsync: undefined,
        fakeRequest,
        maxNumberOfFailures: 10,
      },
    });
    expect(clientResponse).toEqual([
      {
        channel: channelId,
        outcome: '✅ Message sent to C12345',
      },
    ]);
  });

  test('sends message using a custom block layout', async ({
    testSlackClient,
    testSummaryAllTestsFailed,
  }) => {
    const fakeRequest = async (): Promise<ChatPostMessageResponse> => ({
      ok: true,
    });

    const channelId = 'C12345';
    const clientResponse = await testSlackClient.sendMessage({
      options: {
        channelIds: [channelId],
        summaryResults: testSummaryAllTestsFailed,
        customLayout: generateCustomLayout,
        customLayoutAsync: undefined,
        fakeRequest,
        maxNumberOfFailures: 10,
      },
    });
    expect(clientResponse).toEqual([
      {
        channel: channelId,
        outcome: '✅ Message sent to C12345',
      },
    ]);
  });

  test('provides an error when posting message to Slack fails', async ({
    testSlackClient,
    testSummaryAllTestsPassed,
  }) => {
    const fakeFailedRequest = async (): Promise<ChatPostMessageResponse> => {
      throw new Error('Something went wrong');
    };
    const channelId = 'C12345';
    const clientResponse = await testSlackClient.sendMessage({
      options: {
        channelIds: [channelId],
        summaryResults: testSummaryAllTestsPassed,
        customLayout: undefined,
        customLayoutAsync: undefined,
        fakeRequest: fakeFailedRequest,
        maxNumberOfFailures: 10,
      },
    });
    expect(clientResponse).toEqual([
      {
        channel: channelId,
        outcome: '❌ Message not sent to C12345 \r\n Something went wrong',
      },
    ]);
  });
});
