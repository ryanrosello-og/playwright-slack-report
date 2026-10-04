---
title: Incoming webhooks
description: Connect Slack with an incoming webhook.
---

Enable incoming webhooks in your Slack workspace by following the steps as per Slack's documentation:

https://api.slack.com/messaging/webhooks

Once you have enabled incoming webhooks, you will need to copy the webhook URL and specify it in the config:

```typescript
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
        sendResults: "always", // "always" , "on-failure", "off"
      },
    ],
    ["dot"], // other reporters
  ],
```

### Note I:

You will most likely need to have Slack administrator rights to perform the steps above.

### Note II:

Sending failure details in a thread is not supported when using webhooks. You will need to use Option B below.

### Note III:

You can use `slackWebHookChannel: "pw-tests"` as an option if you have a single Slack webhook URL that needs to send messages to multiple channels.
