import { expect } from '@playwright/test';
import { ChatPostMessageResponse } from '@slack/web-api';
import { test } from './fixtures';

test.describe('SlackClient.sendMessage()', () => {
  test('sends message using default block layout', async ({
    testSlackClient,
    testSummaryAllTestsPassed,
  }) => {
    const fakeRequest = async (): Promise<ChatPostMessageResponse> => {
      return {
        ok: true,
      };
    };
    const channelId = 'C12345';
    const clientResponse = await testSlackClient.sendMessage({
      channelIds: [channelId],
      summaryResults: testSummaryAllTestsPassed,
      customLayout: undefined,
      fakeRequest,
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
    testSummaryAllTestsPassed,
  }) => {
    const fakeRequest = async (): Promise<ChatPostMessageResponse> => {
      return {
        ok: true,
      };
    };

    const customLayout = (summaryResults: never): never[] => {
      return [];
    };

    const channelId = 'C12345';
    const clientResponse = await testSlackClient.sendMessage({
      channelIds: [channelId],
      summaryResults: testSummaryAllTestsPassed,
      customLayout: customLayout,
      fakeRequest,
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
      channelIds: [channelId],
      summaryResults: testSummaryAllTestsPassed,
      customLayout: undefined,
      fakeRequest: fakeFailedRequest,
    });
    expect(clientResponse).toEqual([
      {
        channel: channelId,
        outcome: '❌ Message not sent to C12345 \r\n Something went wrong',
      },
    ]);
  });
});
