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
- 🟡 Show flaky test names and actual retry counts, with optional `on-flaky` alerts
- 🚨 Report global errors, run timeouts, and graceful interruptions, including runs with zero failed tests
- 📄 Include additional meta information into your test summary e.g. Branch, BuildId etc
- 🧑‍🎨 Define your own custom Slack message layout!

# 📦 Installation

Run following commands:

**yarn**

`yarn add playwright-slack-report -D`

**npm**

`npm install playwright-slack-report -D`

Contributors use Bun, pinned in [`.bun-version`](./.bun-version). Run `bun install --frozen-lockfile`, `bun run build`, and `bun test`; use `bun run test:coverage` for coverage. See the [contributor guide](https://ryanrosello-og.github.io/playwright-slack-report/docs/contributing/) for the complete workflow. Consumers can keep their existing Node/npm/Yarn setup.

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

The CLI includes top-level Playwright JSON `errors` in its report. It infers a
failed run from global errors or failed tests, and otherwise an interrupted run
from interrupted test results. Failures take precedence because fail-fast runs
can interrupt other workers. Standard Playwright JSON does not contain the overall
run status, so provide `--run-status` when your runner knows the exact outcome:

```sh
npx playwright-slack-report -c cli_config.json -j results.json --run-status timedout
```

Allowed values are `passed`, `failed`, `timedout`, and `interrupted`. This option
sets the reported run status without changing test counts or hiding global
errors. Without it, a global timeout may be reported as failed or interrupted,
depending on the recorded errors and test results. The CLI's exit code continues
to describe reporting success, rather than the original test run outcome.

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
```

### **channels**

An array of Slack channels to post to, at least one channel is required

### **onSuccessChannels**

(Optional) An array of Slack channels to post to when tests have passed. Value from `channels` is used if not defined here

### **onFailureChannels**

(Optional) An array of Slack channels to post to when tests have failed, global errors occurred, or the run timed out or was interrupted. Value from `channels` is used if not defined here

### **sendResults**

Can be _"always"_, _"on-failure"_, _"on-flaky"_ or _"off"_:

- **always** - will send the results to Slack at completion of the test run
- **on-failure** - sends results for failed tests, global errors, run timeouts, and graceful interruptions, including when no tests failed
- **on-flaky** - sends only when Playwright reports at least one flaky test, including tests that pass on retry. Runs with failures but no flaky tests are skipped; mixed runs with both are sent. Flaky-only runs use `onSuccessChannels`; mixed runs use `onFailureChannels`.
- **off** - turns off the reporter, it will not send the results to Slack

### **layout**

A function that returns a layout object, this configuration is optional. See section below for more details.

- meta - an array of meta data to be sent to Slack, this configuration is optional.

### **layoutAsync**

Same as **layout** above, but asynchronous in that it returns a promise.

### **maxNumberOfFailuresToShow**

Limits the combined number of global errors and test failures shown in the Slack
message, defaults to 10. Global errors are shown first. Set to 0 to hide details;
the overall unsuccessful run status remains visible. The CLI uses
`maxNumberOfFailures` for the same limit.

### Run-level errors and interruptions

The reporter captures Playwright's global `onError` events and the final run
status from `onEnd`. Setup/teardown errors, worker errors, global timeouts, and
gracefully interrupted runs can therefore notify Slack even when the failed-test
count is zero. An actual Playwright "No tests found" error also sends a failure
notification; a clean empty run without errors stays silent.

The default layout shows an unsuccessful run status above the details. Global
errors are separate from test failures, so they do not inflate test counts.
With `showInThread: true`, bot reports put both kinds of error details in the
report's thread while retaining the run status in the parent. Webhook reports
show the details inline.

Custom layouts receive these optional `SummaryResults` fields:

| Field | Meaning |
| --- | --- |
| `runStatus` | `passed`, `failed`, `timedout`, or `interrupted` |
| `runErrors` | Global error strings with ANSI formatting removed; absent when there are none |

Use both fields when deciding whether a custom layout should display success;
`failed === 0` alone does not imply that the whole run succeeded. Existing custom
layouts retain control of their output and must render these fields themselves.
Notifications require Playwright to reach the reporter's completion callback;
forced termination, `SIGKILL`, or loss of the CI machine can prevent delivery.

### **maxNumberOfFlakyTestsToShow**

Limits flaky test details in the default layout, defaults to 10. Must be a non-negative integer. Set to `0` to hide details while retaining the flaky count and notification behavior. Each entry shows the suite, test, project, and actual retry count, once per test/project/repetition. With `showInThread: true`, bot reports put these details in the thread.

The CLI supports the same `sendResults: "on-flaky"` mode and uses `maxNumberOfFlakyTests` for this limit. Custom layouts receive the complete optional `summaryResults.flakyTests` array containing `{ suite, test, projectName, file, retries }`.

```typescript
{
  channels: ['qa'],
  sendResults: 'on-flaky',
  maxNumberOfFlakyTestsToShow: 5,
  showInThread: true,
}
```

### **slackOAuthToken**

Instead of providing an environment variable `SLACK_BOT_USER_OAUTH_TOKEN` you can specify the token in the config in the `slackOAuthToken` field.

### **slackLogLevel** (default LogLevel.DEBUG)

This option allows you to control slack client severity levels for log entries. It accepts a value from @slack/web-api `LogLevel` enum:

- ERROR
- WARN
- INFO
- DEBUG

Example: `slackLogLevel: "ERROR",` will only log errors to the console.

### **disableUnfurl** (default: true)

Enable or disable unfurling of links in Slack messages.

### **showInThread** (default: false)

Instructs the reporter to show failure and flaky test details in a thread instead of the main channel. Summary counts remain in the parent message.

![Show failures in threads](./assets/threads.png)

### **sendCustomBlocksInThreadAfterIndex** (default: undefined)

Instructs the reporter to send blocks provided by your [custom layout](#-define-your-own-slack-message-custom-layout) to a thread following the index specified. _Example_: 

`sendCustomBlocksInThreadAfterIndex: 3`

### **proxy** (optional)

String representation of your proxy server.
_Example_:

`proxy: "http://proxy.mycompany.com:8080",`

### **meta** (default: empty array)

The meta data to be sent to Slack. This is useful for providing additional context to your test run.

**Examples:**

```typescript
...
meta: [
  {
    key: 'Suite',
    value: 'Nightly full regression',
  },
  {
    key: 'GITHUB_REPOSITORY',
    value: 'octocat/telsa-ui',
  },
  {
    key: 'GITHUB_REF',
    value: process.env.GITHUB_REF,
  },
],
...
```

# 🎨 Define your own Slack message custom layout

You can define your own Slack message layout to suit your needs.

Firstly, install the necessary type definitions:

`yarn add @slack/types -D`

Next, define your layout function. The signature of this function should adhere to example below:

```typescript
import { Block, KnownBlock } from '@slack/types';
import { SummaryResults } from 'playwright-slack-report/dist/src';

const generateCustomLayout = (
  summaryResults: SummaryResults,
): Array<KnownBlock | Block> => {
  // your implementation goes here
};

export default generateCustomLayout;
```

In your, `playwright.config.ts` file, add your function into the config.

```typescript
  import { generateCustomLayout } from "./my_custom_layout";

  ...

  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        channels: ["pw-tests", "ci"], // provide one or more Slack channels
        sendResults: "always", // "always" , "on-failure", "off"
        layout: generateCustomLayout,
        ...
      },
    ],
  ],
```

> Pro Tip: You can use the [block-kit provided by Slack when creating your layout.](https://app.slack.com/block-kit-builder/)

### Examples:

**Example 1: - very simple summary**

```typescript
import { Block, KnownBlock } from '@slack/types';
import { SummaryResults } from '..';

export default function generateCustomLayoutSimpleExample(
  summaryResults: SummaryResults,
): Array<Block | KnownBlock> {
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
  ];
}
```

Generates the following message in Slack:

![Final](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-13_8-02-54.png?raw=true)

**Example 2: - very simple summary (with Meta information)**

Add the meta block in your config:

```typescript
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        channels: ["demo"],
        sendResults: "always", // "always" , "on-failure", "off",
        layout: generateCustomLayout,
        meta: [
          {
            key: 'EXAMPLE_META_node_env',
            value: process.env.HOME ,
          },
        ],
      },
    ],
  ],
```

Create the function to generate the layout:

```typescript
import { Block, KnownBlock } from '@slack/types';
import { SummaryResults } from '..';

export default function generateCustomLayoutSimpleMeta(
  summaryResults: SummaryResults,
): Array<Block | KnownBlock> {
  const meta: { type: string; text: { type: string; text: string } }[] = [];
  if (summaryResults.meta) {
    for (let i = 0; i < summaryResults.meta.length; i += 1) {
      const { key, value } = summaryResults.meta[i];
      meta.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\n*${key}* :\t${value}`,
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
```

Generates the following message in Slack:

![Final](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-13_8-17-46.png?raw=true)

**Example 3: - With screenshots and/or recorded videos (using AWS S3)**

In your, `playwright.config.ts` file, add these params (Make sure you use **layoutAsync** rather than **layout**):

```typescript
  import { generateCustomLayoutAsync } from "./my_custom_layout";
  ...
  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        ...
        layoutAsync: generateCustomLayoutAsync,
        ...
      },
    ],
  ],
  use: {
    ...
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...
  },
```

Create the function to generate the layout asynchronously in `my_custom_layout.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import { Block, KnownBlock } from '@slack/types';
import { SummaryResults } from 'playwright-slack-report/dist/src';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET || '',
  },
  region: process.env.S3_REGION,
});
```

Run `npx playwright test`. For multiple channels and failure threads, follow the [Slack bot guide](https://ryanrosello-og.github.io/playwright-slack-report/docs/slack-bot/).

## Contribute

Read the [contributor guide](website/docs/contributing.md), [consumer harness guide](website/docs/consumer-harness.md), and [website development guide](website/docs/website.md). [Open an issue](https://github.com/ryanrosello-og/playwright-slack-report/issues) for bugs or feature requests.

[MIT license](LICENSE).
