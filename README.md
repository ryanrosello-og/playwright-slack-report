# playwright-slack-report

Publish Playwright test results to the Slack channels where your team works. Supports incoming webhooks, Slack bots, failure threads, custom message layouts, and merged reports from sharded runs.

[Documentation](https://ryanrosello-og.github.io/playwright-slack-report/) · [Getting started](https://ryanrosello-og.github.io/playwright-slack-report/docs/getting-started/) · [Configuration](https://ryanrosello-og.github.io/playwright-slack-report/docs/configuration/)

## Install

```sh
npm install -D playwright-slack-report
# or
yarn add -D playwright-slack-report
```

## Quick start

Create a [Slack incoming webhook](https://ryanrosello-og.github.io/playwright-slack-report/docs/webhooks/) and set `SLACK_WEBHOOK_URL` in your environment. Add the reporter to `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['dot'],
    [
      './node_modules/playwright-slack-report/dist/src/SlackReporter.js',
      {
        slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
        sendResults: 'always',
      },
    ],
  ],
});
```

Run `npx playwright test`. For multiple channels and failure threads, follow the [Slack bot guide](https://ryanrosello-og.github.io/playwright-slack-report/docs/slack-bot/).

## Contribute

Read the [contributor guide](website/docs/contributing.md), [consumer harness guide](website/docs/consumer-harness.md), and [website development guide](website/docs/website.md). [Open an issue](https://github.com/ryanrosello-og/playwright-slack-report/issues) for bugs or feature requests.

[MIT license](LICENSE).
