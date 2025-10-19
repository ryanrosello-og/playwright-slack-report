import { test as base, expect } from '@playwright/test';
import { IncomingWebhook } from '@slack/webhook';
import { stubObject } from 'ts-sinon';
import SlackWebhookClient from '../src/SlackWebhookClient';
import { SummaryResults } from '../src';

const test = base.extend<{ summaryResults: SummaryResults }>({
  summaryResults: {
    failed: 1,
    passed: 1,
    flaky: undefined,
    skipped: 1,
    failures: [
      {
        suite: 'smoke',
        test: 'test',
        failureReason: 'Unexpected error',
      },
    ],
    meta: [
      {
        key: 'Build',
        value: '1.0.0',
      },
    ],
    tests: [
      {
        file: 'tests/smoke.spec.ts',
        suiteName: 'checkout',
        name: 'add to cart',
        browser: 'chromium',
        projectName: 'playwright-slack-report',
        endedAt: '2021-08-04T14:00:00.000Z',
        reason: 'Unexpected error',
        retry: 0,
        startedAt: '2021-08-04T14:00:00.000Z',
        status: 'failed',
      },
    ],
  },
});

test.describe('SlackWebhookClient.sendMessage()', () => {
  test('returns ok when the message provided is valid', async ({
    summaryResults,
  }) => {
    const webhook = new IncomingWebhook(
      'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    );
    const webHookStub = stubObject<IncomingWebhook>(webhook);
    webHookStub.send.resolves({ text: 'ok' });
    const client = new SlackWebhookClient(webHookStub);
    const result = await client.sendMessage({
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: 10,
      summaryResults,
      disableUnfurl: true,
    });
    expect(result).toEqual({ outcome: 'ok' });
    expect(webHookStub.send.args[0][0]).toEqual({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🎭 *Playwright Results*',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ *1* | ❌ *1* | ⏩ *1*',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '\n*Build* :\t1.0.0',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*smoke > test*\n        \n>Unexpected error',
          },
        },
      ],
      unfurl_links: false,
    });
  });

  test('returns an error message when sending message to webhook fails', async ({
    summaryResults,
  }) => {
    const webhook = new IncomingWebhook(
      'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    );
    const webHookStub = stubObject<IncomingWebhook>(webhook);
    webHookStub.send.resolves(undefined);
    const client = new SlackWebhookClient(webHookStub);
    const result = await client.sendMessage({
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: 10,
      summaryResults,
      disableUnfurl: true,
    });
    expect(result).toEqual({
      outcome:
        '😵 Failed to send webhook message, ensure your webhook url is valid',
    });
  });
});
