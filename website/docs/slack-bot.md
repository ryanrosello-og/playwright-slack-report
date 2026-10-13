---
title: Slack bot setup
description: Create a Slack bot for channel delivery and failure threads.
---

Use a bot to send reports to multiple channels or put failure, global error, and flaky details in a thread. Complete the [installation prerequisites](./getting-started.md#prerequisites) first.

## Create and authorize the Slack app

You need permission to create and install an app in your workspace; your administrator may need to approve it. The screenshots illustrate the setup flow; Slack may change the appearance of these screens.

1. Navigate to https://api.slack.com/apps
2. Click the Create New App button and select "From scratch"

![Navigate to https://api.slack.com/apps](../static/img/2022-08-09_5-37-11.png)

3. Input a name for your app and select the target workspace, then click on the **Create App** button

![Input a name for your app and select the target workspace](../static/img/2022-08-09_5-40-51.png)

4. Under the Features menu, select **OAuth & Permissions** and scroll down to **Scopes** section

![Under the Features menu select](../static/img/2022-08-09_5-44-29.png)

5. Click the **Add an OAuth Scope** button and select the following scopes:

![Click the Add an OAuth Scope](../static/img/2022-08-09_5-48-30.png)

- chat:write
- chat:write.public
- chat:write.customize

6. Scroll up to the OAuth Tokens for Your Workspace and click the **Install to Workspace** button

![Install](../static/img/2022-08-09_5-55-22.png)

> You will be prompted with the message below, click the Allow button

![click the Allow button](../static/img/2022-08-09_5-49-49.png)

The final step will be to copy the generated Bot User OAuth Token aka `SLACK_BOT_USER_OAUTH_TOKEN`.

> **Treat this token as a secret.**

![Final](../static/img/2022-08-09_5-53-17.png)

## Configure the reporter and run tests

Configure the reporter with one or more channel names:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['dot'],
    [
      './node_modules/playwright-slack-report/dist/src/SlackReporter.js',
      {
        channels: ['pw-tests', 'ci'],
        sendResults: 'always',
        showInThread: true,
      },
    ],
  ],
});
```

Run your tests by providing your `SLACK_BOT_USER_OAUTH_TOKEN` as an environment variable or specifying `slackOAuthToken` option in the config:

**Bash / zsh**

```sh
export SLACK_BOT_USER_OAUTH_TOKEN='xoxb-your-bot-token'
npx playwright test
```

**PowerShell**

```powershell
$env:SLACK_BOT_USER_OAUTH_TOKEN = 'xoxb-your-bot-token'
npx playwright test
```

Public channel names work with the scopes above. For private channels, invite the bot to the channel and configure its channel ID. Slack requires membership for private-channel delivery; see [Slack channel permissions](https://docs.slack.dev/reference/methods/chat.postMessage/#channels).

The reporter posts a summary to each configured channel when the run completes. With `showInThread: true`, details appear beneath the parent summary. Do not also configure `slackWebHookUrl`.

## Next steps

See [Configuration](./configuration.md) to route successful and unsuccessful runs separately, control notification rules, and add metadata. For existing JSON results, use [CLI bot delivery](./cli.md#configure-bot-delivery).
