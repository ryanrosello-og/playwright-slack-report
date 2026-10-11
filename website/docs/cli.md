---
title: CLI and sharded runs
description: Merge Playwright reports and send one Slack summary from your CI pipeline.
---

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

- `sendResults` - `always`, `on-failure`, or `on-flaky`. `on-flaky` sends only when the merged report contains flaky tests, even if they passed on retry. Runs with failures but no flaky tests are skipped; `on-failure` continues to skip flaky-only runs.
- `maxNumberOfFlakyTests` - Maximum flaky test details shown by the default layout, defaults to 10. Must be a non-negative integer; `0` hides details while keeping the count and notification behavior. Unlike the reporter's `maxNumberOfFlakyTestsToShow`, the CLI uses this shorter name.
- `proxy` - String representation of your proxy server.
- `sendUsingWebhook` - Object containing the webhook url to send the results to (see example below)
- `customLayout` - Object specifying the custom layout relative path and function name:

```
  "customLayout": {
    "source": "./custom_block/cli_block_with_meta.ts",
    "functionName": "generateCustomLayoutSimpleMeta"
  }
```

Flaky entries include suite, test name, project, and actual retry count, once per test/project/repetition. They appear alongside failures with an independent limit. With `showInThread: true`, bot messages put both types of details in the thread; webhooks show them inline. Custom layouts receive the complete `summaryResults.flakyTests` array.

For a bot alert focused on flaky tests:

```json
{
  "sendResults": "on-flaky",
  "slackLogLevel": "error",
  "sendUsingBot": { "channels": ["qa"] },
  "maxNumberOfFlakyTests": 5,
  "showInThread": true
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

`SLACK_BOT_USER_OAUTH_TOKEN=[your Slack bot user OAUTH token] npx playwright-slack-report -c cli_config.json -j merged_tests_results.json`

Both the `-c` and `-j` options are required. The `-c` option is the path to your config file and the `-j` option is the path to your merged JSON report. The `>` operator is used only when generating the merged JSON report; pass that file directly to `-j` when sending it.

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
    - uses: actions/checkout@v7
    - uses: actions/setup-node@v7
      with:
        node-version: 24
    - name: Install dependencies
      run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v4
      with:
        pattern: blob-report-*
        merge-multiple: true
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
