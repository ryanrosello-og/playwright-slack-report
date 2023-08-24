# playwright-slack-report ![Builds](https://github.com/ryanrosello-og/playwright-slack-report/actions/workflows/playwright.yml/badge.svg) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ryanrosello-og/playwright-slack-report/blob/master/LICENSE) [![Coverage Status](https://coveralls.io/repos/github/ryanrosello-og/playwright-slack-report/badge.svg?branch=main)](https://coveralls.io/github/ryanrosello-og/playwright-slack-report?branch=main)

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/ryanrosello-og/playwright-slack-report)

![Main Logo](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/_logo.png?raw=true)

Publish your Playwright test results to your favorite Slack channel(s).

![Gif](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-15_20-22-59.png?raw=true)

## 🚀 Features

- 💌 Send results your Playwright test results to one or more Slack channels
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
Sending failure details in a thread is not supported when using webhooks.  You will need to use Option B below.

# Option B
Run your tests by providing your `SLACK_BOT_USER_OAUTH_TOKEN` as an environment variable or specifying `slackOAuthToken` option in the config:

`SLACK_BOT_USER_OAUTH_TOKEN=[your Slack bot user OAUTH token] npx playwright test`

> **NOTE:** The Slack channel that you specify will need to be *public*, this app will not be able to publish messages to private channels.

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

* chat:write
* chat:write.public
* chat:write.customize

6. Scroll up to the OAuth Tokens for Your Workspace and click the **Install to Workspace** button

![Install](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-55-22.png?raw=true)

> You will be prompted with the message below, click the Allow button

![click the Allow button](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-49-49.png?raw=true)

The final step will be to copy the generated Bot User OAuth Token aka `SLACK_BOT_USER_OAUTH_TOKEN`.

>**Treat this token as a secret.**

![Final](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/assets/2022-08-09_5-53-17.png?raw=true)

</details>

---

# ⚙️ Configuration

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
### **sendResults**
Can either be *"always"*, *"on-failure"* or *"off"*, this configuration is required:
  * **always** - will send the results to Slack at completion of the test run
  * **on-failure** - will send the results to Slack only if a test failures are encountered
  * **off** - turns off the reporter, it will not send the results to Slack
### **layout**
A function that returns a layout object, this configuration is optional.  See section below for more details.
* meta - an array of meta data to be sent to Slack, this configuration is optional.
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

### **proxy** (optional)
String representation of your proxy server.
*Example*:

`proxy: "http://proxy.mycompany.com:8080",`

### **meta** (default: empty array)
The meta data to be sent to Slack.  This is useful for providing additional context to your test run.

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


Next, define your layout function.  The signature of this function should adhere to example below:

```typescript
import { Block, KnownBlock } from "@slack/types";
import { SummaryResults } from "playwright-slack-report/dist/src";

const generateCustomLayout = (summaryResults: SummaryResults):Array<KnownBlock | Block> => {
  // your implementation goes here
}

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

>Pro Tip:  You can use the [block-kit provided by Slack when creating your layout.](https://app.slack.com/block-kit-builder/)

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
  const meta: { type: string; text: { type: string; text: string; }; }[] = [];
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
import fs from "fs";
import path from "path";
import { Block, KnownBlock } from "@slack/types";
import { SummaryResults } from "playwright-slack-report/dist/src";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET || "",
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
      })
    );

    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${name}`;
  } catch (err) {
    console.log("🔥🔥 Error", err);
  }
}


export async function generateCustomLayoutAsync (summaryResults: SummaryResults): Promise<Array<KnownBlock | Block>> {
  const { tests } = summaryResults;
  // create your custom slack blocks

  const header = {
    type: "header",
    text: {
      type: "plain_text",
      text: "🎭 *Playwright E2E Test Results*",
      emoji: true,
    },
  };

  const summary = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `✅ *${summaryResults.passed}* | ❌ *${summaryResults.failed}* | ⏩ *${summaryResults.skipped}*`,
    },
  };

  const fails: Array<KnownBlock | Block> = [];

  for (const t of tests) {
    if (t.status === "failed" || t.status === "timedOut") {

      fails.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `👎 *[${t.browser}] | ${t.suiteName.replace(/\W/gi, "-")}*`,
        },
      });

      const assets: Array<string> = [];

      if (t.attachments) {
        for (const a of t.attachments) {
          // Upload failed tests screenshots and videos to the service of your choice
          // In my case I upload the to S3 bucket
          const permalink = await uploadFile(
            a.path,
            `${t.suiteName}--${t.name}`.replace(/\W/gi, "-").toLowerCase()
          );

          if (permalink) {
            let icon = "";
            if (a.name === "screenshot") {
              icon = "📸";
            } else if (a.name === "video") {
              icon = "🎥";
            }

            assets.push(`${icon}  See the <${permalink}|${a.name}>`);
          }
        }
      }

      if (assets.length > 0) {
        fails.push({
          type: "context",
          elements: [{ type: "mrkdwn", text: assets.join("\n") }],
        });
      }
    }
  }

  return [header, summary, { type: "divider" }, ...fails]
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
...
const web_api_1 = require('@slack/web-api');
const slackClient = new web_api_1.WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN);

async function uploadFile(filePath) {
  try {
    const result = await slackClient.files.uploadV2({
      channel_id: 'C05H7TKVDUK',  << this is the channel id not channel name! ☠️
      file: fs.createReadStream(filePath),
      filename: filePath.split('/').at(-1),
    });

    return result.file;
  } catch (error) {
    console.log('🔥🔥 error', error);
  }
}

export async function generateCustomLayoutAsync (summaryResults: SummaryResults): Promise<Array<KnownBlock | Block>> {
  const { tests } = summaryResults;
  ....
  // See the snippet above ^^^


    if (t.attachments) {
      for (const a of t.attachments) {
        const file = await uploadFile(a.path);

        if (file) {
          if (a.name === 'screenshot' && file.permalink) {
            fails.push({
              alt_text: '',
              image_url: file.permalink,
              title: { type: 'plain_text', text: file.name || '' },
              type: 'image',
            });
          }

          if (a.name === 'video' && file.permalink) {
            fails.push({
              alt_text: '',
              // NOTE:
              // Slack requires thumbnail_url length to be more that 0
              // Either set screenshot url as the thumbnail or add a placeholder image url
              thumbnail_url: '',
              title: { type: 'plain_text', text: file.name || '' },
              type: 'video',
              video_url: file.permalink,
            });
          }
        }
      }
    }
  ....

  return [header, summary, { type: "divider" }, ...fails]
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

* Execute `npm install`
* Set your `SLACK_BOT_USER_OAUTH_TOKEN` environment variable
* Modify the `playwright.config.ts` as above
* Run the tests using `npx playwright text`

# 🐛 Something not working for you?

Feel free to [raise a github issue](https://github.com/ryanrosello-og/playwright-slack-report/issues) for any bugs or feature requests.
