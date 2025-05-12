# playwright-slack-report ![Builds](https://github.com/ryanrosello-og/playwright-slack-report/actions/workflows/playwright.yml/badge.svg) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ryanrosello-og/playwright-slack-report/blob/master/LICENSE) [![Coverage Status](https://coveralls.io/repos/github/ryanrosello-og/playwright-slack-report/badge.svg?branch=main)](https://coveralls.io/github/ryanrosello-og/playwright-slack-report?branch=main) [![CodeQL](https://github.com/ryanrosello-og/playwright-slack-report/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main)](https://github.com/ryanrosello-og/playwright-slack-report/actions/workflows/github-code-scanning/codeql) <a href="https://www.buymeacoffee.com/ryanrosello.og"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" height="20px"></a>

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/ryanrosello-og/playwright-slack-report)

![Main Logo](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/_logo.png?raw=true)

Publish your Playwright test results to your favorite Slack channel(s).

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

In your `cli_config.json` file:

`__ENV_BUILD_ID` is equivalent to `process.env.BUILD_ID`. This will be automatically handled for you.

You will encounter the following error if the environment variable is not defined:

```bash
❌ Environment variable [blah] was not set.
        This variable was found in the [meta] section of the config file, ensure the variable is set in your environment.
```

### Sample Github Actions workflow

```yaml
  ...

  merge-reports:
    # Merge reports after playwright-tests, even if some shards have failed
    if: always()
    needs: [playwright-tests]

    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v3
      with:
        name: all-blob-reports
        path: all-blob-reports

    - name: Merge into JSON Report
      run: npx playwright merge-reports --reporter json ./all-blob-reports > merged_tests_results.json

    - name: View merged results
      run: cat ${GITHUB_WORKSPACE}/merged_tests_results.json

    - name: Send report to Slack using CLI
      env:
        SLACK_BOT_USER_OAUTH_TOKEN: ${{ secrets.SLACK_BOT_USER_OAUTH_TOKEN }}
      run: npx playwright-slack-report --config="${GITHUB_WORKSPACE}/cli_config.json" --json-results="${GITHUB_WORKSPACE}/merged_tests_results.json"
  ...
```

# ⚙️ Configuration (applicable for Option A and Option B)

An example advanced configuration is shown below:

```typescript
  import { generateCustomLayout } from "./my_custom_layout";
  import { LogLevel } from '@slack/web-api';
  ...

  reporter: [
    [
      "./node_modules/playwright-slack-report/dist/src/SlackReporter.js",
      {
        channels: ["pw-tests", "ci"], // provide one or more Slack channels
        sendResults: "always", // "always" , "on-failure", "off"
        layout: generateCustomLayout,
        maxNumberOfFailuresToShow: 4,
        meta: [
            {
                key: 'BUILD_NUMBER',
                value: '323332-2341',
            },
            {
                key: 'WHATEVER_ENV_VARIABLE',
                value: process.env.SOME_ENV_VARIABLE, // depending on your CI environment, this can be the branch name, build id, etc
            },
            {
                key: 'HTML Results',
                value: '<https://your-build-artifacts.my.company.dev/pw/23887/playwright-report/index.html|📊>',
            },
        ],
        slackOAuthToken: 'YOUR_SLACK_OAUTH_TOKEN',
        slackLogLevel: LogLevel.DEBUG,
        disableUnfurl: true,
        showInThread: true,
      },

    ],
  ],
```

### **channels**

An array of Slack channels to post to, at least one channel is required

### **onSuccessChannels**

(Optional) An array of Slack channels to post to when tests have passed. Value from `channels` is used if not defined here

### **onFailureChannels**

(Optional) An array of Slack channels to post to when tests have failed. Value from `channels` is used if not defined here

### **sendResults**

Can either be _"always"_, _"on-failure"_ or _"off"_, this configuration is required:

- **always** - will send the results to Slack at completion of the test run
- **on-failure** - will send the results to Slack only if a test failures are encountered
- **off** - turns off the reporter, it will not send the results to Slack

### **layout**

A function that returns a layout object, this configuration is optional. See section below for more details.

- meta - an array of meta data to be sent to Slack, this configuration is optional.

### **layoutAsync**

Same as **layout** above, but asynchronous in that it returns a promise.

### **maxNumberOfFailuresToShow**

Limits the number of failures shown in the Slack message, defaults to 10.

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

Instructs the reporter to show the failure details in a thread instead of the main channel.

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

async function uploadFile(filePath, fileName) {
  try {
    const ext = path.extname(filePath);
    const name = `${fileName}${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: name,
        Body: fs.createReadStream(filePath),
      }),
    );

    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${name}`;
  } catch (err) {
    console.log('🔥🔥 Error', err);
  }
}

export async function generateCustomLayoutAsync(
  summaryResults: SummaryResults,
): Promise<Array<KnownBlock | Block>> {
  const { tests } = summaryResults;
  // create your custom slack blocks

  const header = {
    type: 'header',
    text: {
      type: 'plain_text',
      text: '🎭 *Playwright E2E Test Results*',
      emoji: true,
    },
  };

  const summary = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `✅ *${summaryResults.passed}* | ❌ *${summaryResults.failed}* | ⏩ *${summaryResults.skipped}*`,
    },
  };

  const fails: Array<KnownBlock | Block> = [];

  for (const t of tests) {
    if (t.status === 'failed' || t.status === 'timedOut') {
      fails.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `👎 *[${t.browser}] | ${t.suiteName.replace(/\W/gi, '-')}*`,
        },
      });

      const assets: Array<string> = [];

      if (t.attachments) {
        for (const a of t.attachments) {
          // Upload failed tests screenshots and videos to the service of your choice
          // In my case I upload the to S3 bucket
          const permalink = await uploadFile(
            a.path,
            `${t.suiteName}--${t.name}`.replace(/\W/gi, '-').toLowerCase(),
          );

          if (permalink) {
            let icon = '';
            if (a.name === 'screenshot') {
              icon = '📸';
            } else if (a.name === 'video') {
              icon = '🎥';
            }

            assets.push(`${icon}  See the <${permalink}|${a.name}>`);
          }
        }
      }

      if (assets.length > 0) {
        fails.push({
          type: 'context',
          elements: [{ type: 'mrkdwn', text: assets.join('\n') }],
        });
      }
    }
  }

  return [header, summary, { type: 'divider' }, ...fails];
}
```

**Example 4: - Upload the attachments to directly to Slack**

To enable this functionality, make sure the slackbot user has the following additional scopes:

- `files:write`
- `files:read`

You will need to re-install the app and re-invite the bot into the channel.

The value of the channel_id should be the channel id of the channel you want to upload the file to. This channel id can be found in the url when you are in the channel. e.g.

**https://app.slack.com/client/T02RVEEFPDH/C05H7TKVDUK**

^ the bit starting with 'C...' is your channel id. In this case, the channel id is `C05H7TKVDUK`

```typescript
import web_api_1 from '@slack/web-api';
import fs from 'fs';
const slackClient = new web_api_1.WebClient(
  process.env.SLACK_BOT_USER_OAUTH_TOKEN,
);

async function uploadFile(
  filePath: string,
): Promise<web_api_1.FilesCompleteUploadExternalResponse[] | undefined> {
  try {
    const result = await slackClient.filesUploadV2({
      channel_id: 'C05H7TKVDUK', // << this is the channel id not channel name! ☠️
      file: fs.createReadStream(filePath),
      filename: filePath.split('/').at(-1),
    });

    return result.files;
  } catch (error) {
    console.log('🔥🔥 error', error);
  }
}

export default async function generateCustomLayout(
  summaryResults: SummaryResults,
): Promise<({ type: string; text: { type: string; text: string } } | Block)[]> {
  const header = {
    type: 'header',
    text: {
      type: 'plain_text',
      text: '🎭 *Playwright E2E Test Results*',
      emoji: true,
    },
  };

  const summary = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `✅ *${summaryResults.passed}* | ❌ *${summaryResults.failed}* | ⏩ *${summaryResults.skipped}*`,
    },
  };

  const fails: Array<KnownBlock | Block> = [];
  const { tests } = summaryResults;
  for (const test of tests) {
    if (test.attachments) {
      for (const attachment of test.attachments) {
        const uploadResult = await uploadFile(attachment.path);

        if (uploadResult && uploadResult[0].files) {
          const { name, permalink } = uploadResult[0].files[0];
          if (name === 'image' && permalink) {
            fails.push({
              alt_text: '',
              image_url: permalink,
              title: { type: 'plain_text', text: name || '' },
              type: 'image',
            });
          }

          if (name === 'video' && permalink) {
            fails.push({
              alt_text: '',
              // NOTE:
              // Slack requires thumbnail_url length to be more that 0
              // Either set screenshot url as the thumbnail or add a placeholder image url
              thumbnail_url: '',
              title: { type: 'plain_text', text: name || '' },
              type: 'video',
              video_url: permalink,
            });
          }
        }
      }
    }
  }
  return [header, summary, ...fails];
}
```

# 🔑 License

[MIT](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/LICENSE)

# ✨ Contributing

Clone the project and run `npm install`

Make your changes
Run the tests using `npm run pw`

**To execute and test the entire package:**

Run `npm pack`

Create a new playwright project using `yarn create playwright`
Modify the `package.json` and a local dependency to the generated `tgz` file

e.g.

```
  "dependencies": {
    "playwright-slack-report": "/home/ry/_repo/playwright-slack-report/playwright-slack-report-1.0.3.tgz"
  }
```

- Execute `npm install`
- Set your `SLACK_BOT_USER_OAUTH_TOKEN` environment variable
- Modify the `playwright.config.ts` as above
- Run the tests using `npx playwright text`

# 🐛 Something not working for you?

Feel free to [raise a github issue](https://github.com/ryanrosello-og/playwright-slack-report/issues) for any bugs or feature requests.
