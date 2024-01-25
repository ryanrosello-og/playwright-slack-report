import { expect, test as base } from '@playwright/test';
import { Suite, TestCase } from '@playwright/test/reporter';
import SlackReporter from '../src/SlackReporter';

const test = base.extend<{
  fullConfig: any;
  fakeSlackReporter: SlackReporter;
  suite: Suite;
}>({
  fullConfig: {
    forbidOnly: false,
    fullyParallel: false,
    globalSetup: null,
    globalTeardown: null,
    globalTimeout: 0,
    grep: {},
    grepInvert: null,
    maxFailures: 0,
    metadata: {},
    preserveOutput: 'always',
    projects: [
      {
        grep: {},
        grepInvert: null,
        outputDir: '/home/ry/_repo/playwright-slack-report/test-results',
        repeatEach: 1,
        retries: 0,
        metadata: undefined,
        name: 'chrome',
        testDir: '/home/ry/_repo/playwright-slack-report',
        _respectGitIgnore: true,
        snapshotDir: '/home/ry/_repo/playwright-slack-report',
        _screenshotsDir:
          '/home/ry/_repo/playwright-slack-report/__screenshots__/linux/chrome',
        testIgnore: [],
        testMatch: '**/?(*.)@(spec|test).*',
        timeout: 0,
        use: {
          trace: 'on',
          screenshot: 'on',
          video: 'on',
          headless: false,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.20 Safari/537.36',
          screen: {
            width: 1920,
            height: 1080,
          },
          viewport: {
            width: 1280,
            height: 720,
          },
          deviceScaleFactor: 1,
          isMobile: false,
          hasTouch: false,
          defaultBrowserType: 'chromium',
        },
      },
    ],
    reporter: [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        {
          channels: ['zeb', 'pw'],
          sendResults: 'always',
          meta: [
            {
              key: 'vsvs',
              value: true,
            },
            {
              key: 'BK',
              value: "I can't seem to figure out how to do that in TypeScript.",
            },
          ],
        },
      ],
      ['dot', undefined],
    ],
    reportSlowTests: {
      max: 5,
      threshold: 15000,
    },
    rootDir: '/home/ry/_repo/playwright-slack-report',
    quiet: false,
    shard: null,
    updateSnapshots: 'missing',
    version: '1.23.3',
    workers: 1,
    webServer: null,
    _globalOutputDir: '/home/ry/_repo/playwright-slack-report',
    _configDir: '/home/ry/_repo/playwright-slack-report',
    _testGroupsCount: 1,
  },
  suite: ({ fullConfig }, use) => {
    const fakeSuite = {
      project: fullConfig,
      allTests(): TestCase[] {
        return [];
      },
      suites: [],
      tests: [],
      title: '',
      titlePath(): string[] {
        return [];
      },
    };
    use(fakeSuite);
  },
  fakeSlackReporter: async ({}, use) => {
    const slackReporter = new SlackReporter();
    await use(slackReporter);
  },
});

test.describe('SlackReporter - onEnd()', () => {
  test('onEnd should halt when configured to stop when no failures are encountered', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    test.fixme();
    process.env.SLACK_BOT_USER_OAUTH_TOKEN = 'xoxoSFDJLKSDJFLKS';
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        { sendResults: 'on-failure' },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);
    await fakeSlackReporter.onEnd();
    expect(
      fakeSlackReporter.logs.includes('⏩ Slack reporter - no failures found'),
    ).toBeTruthy();
  });

  test('onEnd should halt when the preChecks fail', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        { sendResults: 'on-failure' },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);
    await fakeSlackReporter.onEnd();
    expect(
      fakeSlackReporter.logs.includes(
        '❌ Neither slack webhook url, slackOAuthToken nor process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
      ),
    ).toBeTruthy();
  });
});

test.describe('SlackReporter - preChecks()', () => {
  test.beforeEach(async ({}) => {
    process.env.SLACK_BOT_USER_OAUTH_TOKEN = 'xoxoSFDJLKSDJFLKS';
  });

  test('okToProceed flag is set when no errors encountered', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    fakeSlackReporter.onBegin(fullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result.okToProceed).toBeTruthy();
  });

  test('okToProceed flag is set to false when SLACK_BOT_USER_OAUTH_TOKEN is not set', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        { sendResults: 'on-failure' },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message:
        '❌ Neither slack webhook url, slackOAuthToken nor process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
    });
  });

  test('okToProceed flag is set to false when the reporter is turned off', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        { sendResults: 'off' },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message: '❌ Slack reporter is disabled',
    });
  });

  test('okToProceed flag is set to false when an invalid sendResults value is provided', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        { sendResults: 'NO!' },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message:
        "❌ \"sendResults\" is not valid. Expecting one of ['always', 'on-failure', 'off'].",
    });
  });

  test('okToProceed flag is set to false when no channel id supplied', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        { channels: [] },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message:
        '❌ Slack channel(s) for successful tests notifications was not provided in the config',
    });
  });

  test('showInThread only supported for bots not webhooks', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        {
          slackWebHookUrl: 'https://hooks.slack.com/services/1234',
          showInThread: true,
        },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message:
        '❌ The showInThread feature is only supported when using slackOAuthToken or process.env.SLACK_BOT_USER_OAUTH_TOKEN',
    });
  });

  test('okToProceed flag is set to false when the custom layout provided is not a Function', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        {
          layout: 'not a function',
          channels: ['zeb', 'pw'],
        },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message: '❌ Custom layout is not a function',
    });
  });

  test('okToProceed flag is set to false when the meta key is not an array', async ({
    fakeSlackReporter,
    suite,
    fullConfig,
  }) => {
    const cloneFullConfig = JSON.parse(JSON.stringify(fullConfig));
    cloneFullConfig.reporter = [
      [
        '/home/ry/_repo/playwright-slack-report/src/SlackReporter.ts',
        {
          meta: 'not a array',
          channels: ['zeb', 'pw'],
        },
      ],
    ];
    fakeSlackReporter.onBegin(cloneFullConfig, suite);

    const result = fakeSlackReporter.preChecks();
    expect(result).toEqual({
      okToProceed: false,
      message: '❌ Meta is not an array',
    });
  });
});
