const { defineConfig } = require('@playwright/test');
const path = require('node:path');
const bot = process.env.HARNESS_MODE === 'reporter-bot';

module.exports = defineConfig({
  testDir: './artifact-tests', testMatch: '**/*.spec.cjs', workers: 1, retries: 1,
  repeatEach: 2, projects: [{ name: 'chromium' }, { name: 'firefox' }],
  outputDir: './artifact-output',
  reporter: [
    ['line'], ['json', { outputFile: process.env.HARNESS_JSON }],
    [require.resolve('playwright-slack-report/dist/src/SlackReporter.js'), {
      sendResults: 'on-failure', channels: ['harness-artifacts'],
      slackLogLevel: 'error', showInThread: bot,
      artifactLinks: {
        baseUrl: 'https://ci.example/artifacts/',
        pathPrefix: path.resolve('artifact-output'),
        reportUrl: 'https://ci.example/report/index.html',
      },
      ...(bot ? {} : { slackWebHookUrl: 'https://example.invalid/harness-webhook' }),
    }],
  ],
});
