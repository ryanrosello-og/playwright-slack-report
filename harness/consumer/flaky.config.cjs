const { defineConfig } = require('@playwright/test');
const bot = process.env.HARNESS_MODE === 'reporter-bot';

module.exports = defineConfig({
  testDir: './flaky-tests', testMatch: '**/*.spec.cjs',
  workers: 1, repeatEach: 2, retries: 3,
  projects: [{ name: 'chromium' }, { name: 'firefox' }],
  reporter: [
    ['line'], ['json', { outputFile: process.env.HARNESS_JSON }],
    [require.resolve('playwright-slack-report/dist/src/SlackReporter.js'), {
      sendResults: 'on-flaky', channels: ['harness-flaky'],
      slackLogLevel: 'error', showInThread: bot, maxNumberOfFlakyTestsToShow: 10,
      ...(bot ? {} : { slackWebHookUrl: 'https://example.invalid/harness-webhook' }),
    }],
  ],
});
