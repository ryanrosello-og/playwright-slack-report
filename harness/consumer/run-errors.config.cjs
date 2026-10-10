const { defineConfig } = require('@playwright/test');
const fixture = process.env.HARNESS_RUN_FIXTURE;
const bot = process.env.HARNESS_MODE === 'reporter-bot';
module.exports = defineConfig({
  testDir: './run-tests',
  testMatch: fixture === 'no-tests' ? '**/does-not-exist.cjs' : '**/*.spec.cjs',
  workers: 1, retries: 0, timeout: 30000,
  globalTimeout: fixture === 'timeout' ? 2500 : 0,
  globalSetup: fixture === 'setup-error' ? './run-setup.cjs' : undefined,
  globalTeardown: fixture === 'teardown-error' ? './run-teardown.cjs' : undefined,
  reporter: [
    ['line'], ['json', { outputFile: process.env.HARNESS_JSON }], ['./run-lifecycle.cjs'],
    [require.resolve('playwright-slack-report/dist/src/SlackReporter.js'), {
      sendResults: 'on-failure', channels: ['harness-failures'],
      onSuccessChannels: ['harness-success'], onFailureChannels: ['harness-failures'],
      slackLogLevel: 'error', showInThread: bot, disableUnfurl: true,
      meta: [{ key: 'Harness run', value: process.env.HARNESS_RUN_ID }],
      ...(bot ? {} : { slackWebHookUrl: 'https://example.invalid/harness-webhook' }),
    }],
  ],
});
