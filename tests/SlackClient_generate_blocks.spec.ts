import { expect, test } from '@playwright/test';
import generateBlocks from '../src/LayoutGenerator';

test.describe('SlackClient.generateBlocks()', () => {
  test('includes warning message if number of failures exceeds maximum allowed', async () => {
    const generatedBlock = await generateBlocks(
      {
        failed: 2,
        passed: 0,
        skipped: 0,
        failures: [
          { test: 'test', failureReason: 'message' },
          { test: 'test2', failureReason: 'message' },
          { test: 'test3', failureReason: 'message' },
        ],
        tests: [],
      },
      1,
    );
    expect(generatedBlock[6]).toEqual({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*There are too many failures to display - 3 out of 3 failures shown*',
      },
    });
  });

  test('creates blocks with correct stats summary', async () => {
    const generatedBlock = await generateBlocks(
      {
        failed: 1,
        passed: 1,
        skipped: 1,
        failures: [{ test: 'test', failureReason: 'message' }],
        tests: [],
      },
      2,
    );
    expect(generatedBlock).toEqual([
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
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*test*\n        \n>message',
        },
      },
    ]);
  });

  test('creates blocks when meta provided', async () => {
    const generatedBlock = await generateBlocks(
      {
        failed: 0,
        passed: 1,
        skipped: 1,
        failures: [],
        tests: [],
        meta: [
          {
            key: 'BuildID',
            value: '9sdcv-312432-3134',
          },
        ],
      },
      2,
    );
    expect(generatedBlock).toEqual([
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
          text: '✅ *1* | ❌ *0* | ⏩ *1*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '\n*BuildID* :\t9sdcv-312432-3134',
        },
      },
      {
        type: 'divider',
      },
    ]);
  });

  test('creates blocks when test with attachment is provided', async () => {
    const generatedBlock = await generateBlocks(
      {
        failed: 1,
        passed: 0,
        skipped: 1,
        failures: [],
        tests: [
          {
            suiteName: 'accounts',
            name: 'overdue will incur a penalty',
            browser: 'chrome',
            endedAt: new Date().toISOString(),
            reason: '',
            retry: 2,
            startedAt: new Date().toISOString(),
            status: 'passed',
            attachments: [
              {
                body: 'www.google.com',
                contentType: 'text/html',
                name: 'test',
                path: 'c:/test.html',
              },
            ],
          },
        ],
      },
      0,
    );
    expect(generatedBlock).toEqual([
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
          text: '✅ *0* | ❌ *1* | ⏩ *1*',
        },
      },
      {
        type: 'divider',
      },
    ]);
  });
});
