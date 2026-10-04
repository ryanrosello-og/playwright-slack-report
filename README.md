# playwright-slack-report

Publish Playwright test results to the Slack channels where your team works. Supports incoming webhooks, Slack bots, failure threads, custom message layouts, and merged reports from sharded runs.

[Documentation](https://ryanrosello-og.github.io/playwright-slack-report/) · [Getting started](https://ryanrosello-og.github.io/playwright-slack-report/docs/getting-started/) · [Configuration](https://ryanrosello-og.github.io/playwright-slack-report/docs/configuration/)

## Install

For an LLM-friendly repository overview, source map, and development commands, see [llms.txt](llms.txt).

For local and GitHub Actions end-to-end testing of the packaged reporter and CLI
with bot and webhook delivery, see the [consumer harness](harness/README.md).

![Gif](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-15_20-22-59.png?raw=true)

## 🚀 Features

- 💌 Send results your Playwright test results to one or more Slack channels
- 🎚️ Leverage JSON results created by Playwright and seamlessly post them on Slack
- 📊 Conditionally send results to Slack channels based on test results
- 📄 Include additional meta information into your test summary e.g. Branch, BuildId etc
- 🧑‍🎨 Define your own custom Slack message layout!

# 📦 Installation

Run following commands:

**yarn**

`yarn add playwright-slack-report -D`

**npm**

`npm install playwright-slack-report -D`

Modify your `playwright.config.ts` file to include the following:

```typescript
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        channels: ["pw-tests", "ci"], // provide one or more Slack channels
        sendResults: "always", // "always" , "on-failure", "off"
      },
    ],
    ["dot"], // other reporters
  ],
```

# Option A - send your results via a Slack webhook

Enable incoming webhooks in your Slack workspace by following the steps as per Slack's documentation:

https://api.slack.com/messaging/webhooks

Once you have enabled incoming webhooks, you will need to copy the webhook URL and specify it in the config:

```typescript
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        slackWebHookUrl: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
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

# Option B - send your results via a Slack bot user

Run your tests by providing your `SLACK_BOT_USER_OAUTH_TOKEN` as an environment variable or specifying `slackOAuthToken` option in the config:

`SLACK_BOT_USER_OAUTH_TOKEN=[your Slack bot user OAUTH token] npx playwright test`

> **NOTE:** The Slack channel that you specify will need to be _public_, this app will not be able to publish messages to private channels.

---

<details>
<summary><b>🔎 How do I find my Slack bot oauth token?</b></summary>

You will need to have Slack administrator rights to perform the steps below.

1. Navigate to https://api.slack.com/apps
2. Click the Create New App button and select "From scratch"

![Navigate to https://api.slack.com/apps](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-37-11.png?raw=true)

3. Input a name for your app and select the target workspace, then click on the **Create App** button

![Input a name for your app and select the target workspace](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-40-51.png?raw=true)

4. Under the Features menu, select **OAuth & Permissions** and scroll down to **Scopes** section

![Under the Features menu select](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-44-29.png?raw=true)

5. Click the **Add an OAuth Scope** button and select the following scopes:

![Click the Add an OAuth Scope](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-48-30.png?raw=true)

- chat:write
- chat:write.public
- chat:write.customize

6. Scroll up to the OAuth Tokens for Your Workspace and click the **Install to Workspace** button

![Install](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-55-22.png?raw=true)

> You will be prompted with the message below, click the Allow button

![click the Allow button](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-49-49.png?raw=true)

The final step will be to copy the generated Bot User OAuth Token aka `SLACK_BOT_USER_OAUTH_TOKEN`.

> **Treat this token as a secret.**

![Final](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-53-17.png?raw=true)

</details>

---

# Option C - send your JSON results via CLI

Playwright now provides a nice way to [merge multiple reports from multiple shards](https://playwright.dev/docs/test-sharding#merging-reports-from-multiple-shards). You can use this feature to generate a single JSON report and then send it to Slack, alleviating the need to have separate messages sent per shard:

`npx playwright merge-reports --reporter json ./all-blob-reports > merged_tests_results.json`

^ It is important that you set the `--reporter` to `json` and pipe the results to a json file, otherwise the report will not be generated in the correct format.

Next, you will need to configure the cli. See example below:

_cli_config.json:_

```json
{
  "sendResults": "always",
  "slackLogLevel": "error",
  "sendUsingBot": {
    "channels": ["demo"]
  },
  "showInThread": true,
  "meta": [
    { "key": "build", "value": "1.0.0" },
    { "key": "branch", "value": "master" },
    { "key": "commit", "value": "1234567890" },
    {
      "key": "results",
      "value": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    }
  ],
  "maxNumberOfFailures": 4,
  "disableUnfurl": true
}
```

The config file also supports the follow extra options:

- `proxy` - String representation of your proxy server.
- `sendUsingWebhook` - Object containing the webhook url to send the results to (see example below)
- `customLayout` - Object specifying the custom layout relative path and function name:

```
  "customLayout": {
    "source": "./custom_block/cli_block_with_meta.ts",
    "functionName": "generateCustomLayoutSimpleMeta"
  }
```

- `customLayoutAsync` - Similar to `customLayout`, except this key requires an async function:

```
  "customLayoutAsync": {
    "source": "./custom_block/cli_block_with_meta.ts",
    "functionName": "generateCustomAsyncLayoutSimpleMeta"
  }
```

The customLayout typescript file must export a function name using the `exports` syntax e.g. `exports.generateCustomLayoutSimpleMeta = generateCustomLayoutSimpleMeta;`
This file should not contain any `import` statements otherwise it will complain. See example below:

<details>
  <summary>Example custom layout for CLI</summary>

```js
function generateCustomLayoutSimpleMeta(summaryResults) {
  const meta = [];
  if (summaryResults.meta) {
    for (let i = 0; i < summaryResults.meta.length; i += 1) {
      const { key, value } = summaryResults.meta[i];
      meta.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\n*${key}* :🙌\t${value}`,
        },
      });
    }
  }
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          summaryResults.failed === 0
            ? ':tada: All tests passed!'
            : `😭${summaryResults.failed} failure(s) out of ${summaryResults.tests.length} tests`,
      },
    },
    ...meta,
  ];
}

async function generateCustomAsyncLayoutSimpleMeta(summaryResults) {
  const meta = [];
  // do some async stuff here
  if (summaryResults.meta) {
    for (let i = 0; i < summaryResults.meta.length; i += 1) {
      const { key, value } = summaryResults.meta[i];
      meta.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\n*${key}* :😍\t${value}`,
        },
      });
    }
  }
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          summaryResults.failed === 0
            ? ':tada: All tests passed!'
            : `😭${summaryResults.failed} failure(s) out of ${summaryResults.tests.length} tests`,
      },
    },
    ...meta,
  ];
}
exports.generateCustomLayoutSimpleMeta = generateCustomLayoutSimpleMeta;
exports.generateCustomAsyncLayoutSimpleMeta =
  generateCustomAsyncLayoutSimpleMeta;
```

</details>

_Config with extra options_

```json
{
  "sendResults": "always",
  "slackLogLevel": "error",
  "proxy": "http://proxy.mycompany.com:8080",
  "sendUsingWebhook": {
    "webhookUrl": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
  },
  "showInThread": true,
  "meta": [
    { "key": "build", "value": "1.0.0" },
    { "key": "branch", "value": "master" },
    { "key": "commit", "value": "1234567890" },
    {
      "key": "results",
      "value": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    }
  ],
  "maxNumberOfFailures": 4,
  "disableUnfurl": true,
  "customLayout": {
    "source": "./custom_block/cli_block_with_meta.ts",
    "functionName": "generateCustomLayoutSimpleMeta"
  }
}
```

Once you have generated the JSON report and defined your config file, you can send it to Slack using the following command:

`SLACK_BOT_USER_OAUTH_TOKEN=[your Slack bot user OAUTH token] npx playwright-slack-report -c cli_config.json -j > merged_tests_results.json`

Both the `-c` and `-j` options are required. The `-c` option is the path to your config file and the `-j` option is the path to your merged JSON report. You will also need to pipe the output to a json file, using the `>` operator.

### Additional notes

- The config file for the cli app is stand-alone, which means you no longer need to define the Playwright slack reporter in your `playwright.config.ts` file
- In order to handle dynamic meta data e.g. environment variables storing your build id, branch name etc, you can use the `meta` option in the config file and use the format: `__ENV_VARIABLE_NAME` as its value. This will be replaced with the actual value of the environment variable at runtime. See example below:

```json
{
  "sendResults": "always",
  "slackLogLevel": "error",
  "sendUsingBot": {
    "channels": ["demo"]
  },
  "showInThread": true,
  "meta": [
    { "key": "build", "value": "__ENV_BUILD_ID" },
    { "key": "branch", "value": "__ENV_BRANCH_NAME" },
    { "key": "commit", "value": "__ENV_COMMIT_ID" },
    {
      "key": "results",
      "value": "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    }
  ],
  "maxNumberOfFailures": 4,
  "disableUnfurl": true
}
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
