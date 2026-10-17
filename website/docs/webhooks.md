---
title: Incoming webhooks
description: Connect Slack with an incoming webhook.
---

Use a webhook for a summary in one Slack channel. Complete the [installation prerequisites](./getting-started.md#prerequisites) first. Creating or installing a Slack app may require approval from your workspace administrator.

## Create a webhook

1. Create or select an app in [Slack's app dashboard](https://api.slack.com/apps).
2. Open **Incoming Webhooks** and enable **Activate Incoming Webhooks**.
3. Select **Add New Webhook to Workspace**, choose the destination channel, and authorize the app.
4. Copy the generated URL and store it as `SLACK_WEBHOOK_URL` in your shell or CI secrets. Treat the URL as a secret.

See [Slack's incoming webhook guide](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/) for the complete setup flow.

## Configure the reporter

Add this to `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
        sendResults: "always", // Also: "on-failure", "on-flaky", "off"
      },
    ],
    ["dot"], // other reporters
  ],
});
```

Do not configure a bot token alongside the webhook. `SLACK_WEBHOOK_URL` is read by the configuration above; it is not automatically discovered by the reporter.

## Send a report

With `SLACK_WEBHOOK_URL` set, run `npx playwright test`. See [Getting started](./getting-started.md#send-your-first-report) for Bash and PowerShell commands. The summary and error details appear in the channel selected when you created the webhook.

## Webhook capabilities and limits

- Failure, global error, and flaky details appear inline. The reporter rejects `showInThread: true` with a webhook; use a [Slack bot](./slack-bot.md) for threads.
- `channels`, `onSuccessChannels`, and `onFailureChannels` are bot routing options. Modern Slack incoming webhooks post to their configured channel and [cannot override that channel](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/#making-it-fancy-with-advanced-formatting).
- The reporter retains the optional `slackWebHookChannel: 'pw-tests'` field and passes it to Slack as a channel override. It does not enable multi-channel delivery for modern webhooks; use a bot when you need multiple destinations.
- Metadata, custom layouts, conditional notifications, and proxies are available. See [Configuration](./configuration.md).

To publish an existing JSON report through a webhook, use the CLI's [`sendUsingWebhook` configuration](./cli.md#webhook-configuration).
