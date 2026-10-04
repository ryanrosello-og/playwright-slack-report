const { defineConfig } = require('@playwright/test');

const mode = process.env.HARNESS_MODE;
const bot = mode === 'reporter-bot';
const reporter = [['line'], ['json', { outputFile: process.env.HARNESS_JSON }]];
if (mode.startsWith('reporter-')) {
  reporter.push([require.resolve('playwright-slack-report/dist/src/SlackReporter.js'), {
    channels: [process.env.SLACK_CHANNEL || 'pw'],
    sendResults: 'always',
    slackLogLevel: 'error',
    showInThread: bot,
    maxNumberOfFailuresToShow: 10,
    disableUnfurl: true,
    proxy: process.env.HARNESS_PROXY || undefined,
    meta: [{ key: 'Harness run', value: process.env.HARNESS_RUN_ID }],
    ...(bot ? {} : { slackWebHookUrl: process.env.SLACK_WEBHOOK_URL }),
  }]);
}

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.cjs',
  forbidOnly: true,
  workers: 1,
  retries: 1,
  timeout: 10000,
  reporter,
  outputDir: './test-results',
  use: { browserName: 'chromium', baseURL: `http://127.0.0.1:${process.env.HARNESS_PORT}` },
  projects: [{ name: 'chromium' }],
  webServer: {
    command: 'node server.cjs',
    url: `http://127.0.0.1:${process.env.HARNESS_PORT}`,
    reuseExistingServer: false,
    timeout: 15000,
  },
});
