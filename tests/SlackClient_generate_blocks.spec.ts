import { expect, test } from '@playwright/test';
import generateBlocks from '../src/LayoutGenerator';

test.describe('SlackClient.generateBlocks()', () => {
  test('creates blocks with correct stats summary', async () => {
    const generatedBlock = await generateBlocks({
      failed: 1,
      passed: 1,
      skipped: 1,
      failures: [{ test: 'test', failureReason: 'message' }],
      tests: [],
    });
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
          text: '*test*\n        \n\n>message',
        },
      },
    ]);
  });

  test('creates blocks when meta provided', async () => {
    const generatedBlock = await generateBlocks({
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
    });
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
    const generatedBlock = await generateBlocks({
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
    });
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
