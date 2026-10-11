---
title: Feature comparison
description: Compare webhook and Slack bot features in the Playwright reporter and CLI.
---

Each column combines a way to run this package with a way to connect to Slack. **Reporter** means it runs as part of your Playwright test run, configured in `playwright.config.ts`. **CLI** (command-line interface) means you run `npx playwright-slack-report` separately, using a saved or merged Playwright JSON report and its own JSON configuration file.

- **Reporter + webhook:** automatically sends results when tests finish, using an incoming webhook URL tied to a Slack channel.
- **Reporter + bot:** automatically sends results when tests finish, using a Slack bot token. It can post to multiple channels and put details in threads.
- **CLI + webhook:** sends an existing JSON report through an incoming webhook URL when you run the command. You do not need to configure the Slack reporter in Playwright.
- **CLI + bot:** sends an existing JSON report using a Slack bot token when you run the command, with support for multiple channels and threads.

## Features by mode

| Feature | Reporter + webhook | Reporter + bot | CLI + webhook | CLI + bot |
| --- | --- | --- | --- | --- |
| Send automatically when a Playwright run finishes | Yes | Yes | Separate command | Separate command |
| Send an existing or merged Playwright JSON report | No | No | Yes | Yes |
| Send to multiple channels in one invocation | No | Yes | No | Yes |
| Route to different channels for success and failure | No | Yes | No | No |
| Send only on failures (`on-failure`) | Yes | Yes | Yes | Yes |
| Send only when flaky tests occur (`on-flaky`) | Yes | Yes | Yes | Yes |
| Disable sending with `sendResults: 'off'` | Yes | Yes | No | No |
| Show failure and flaky-test details inline | Yes | Yes | Yes | Yes |
| Put failure, run-error, and flaky-test details in a thread | No | Yes | No | Yes |
| Split custom layout blocks into a thread | No | Yes | No | Yes |
| Limit displayed failure and flaky-test details | Yes | Yes | Yes | Yes |
| Custom layouts, including async layouts | Yes | Yes | Yes | Yes |
| Metadata such as branch, build, and report links | Yes | Yes | Yes | Yes |
| HTTP proxy configuration | Yes | Yes | Yes | Yes |
| Disable link previews (`disableUnfurl`) | Yes | Yes | Yes | Yes |
| Report global errors and overall run status | Automatic | Automatic | JSON + status override | JSON + status override |

- Webhooks send to one configured destination per invocation. Bot delivery accepts a list of channels.
- Success/failure channel routing uses the reporter's `onSuccessChannels` and `onFailureChannels`. The CLI bot uses a fixed `sendUsingBot.channels` list.
- `on-failure` skips flaky-only runs; `on-flaky` sends whenever at least one flaky test is present, including mixed failure/flaky runs.
- The CLI reads errors and test outcomes from JSON. Use `--run-status passed|failed|timedout|interrupted` when the overall status cannot be inferred, such as a global timeout.
- Detail limits apply to the default layout. Custom layouts control which details they display.

## Choose a mode

- Use the [reporter with an incoming webhook](./webhooks.md) for a summary in one channel after each test run.
- Use the [reporter with a Slack bot](./slack-bot.md) for multiple channels, success/failure routing, or threaded details.
- Use the [CLI](./cli.md) to send existing JSON results or one combined summary after merging sharded reports. Choose bot delivery if you need multiple channels or threads.

## Configuration names

The reporter takes options in `playwright.config.ts`; the CLI reads a separate JSON configuration file.

| Setting | Reporter | CLI |
| --- | --- | --- |
| Webhook URL | `slackWebHookUrl` | `sendUsingWebhook.webhookUrl` |
| Bot channels | `channels` | `sendUsingBot.channels` |
| Bot token | `slackOAuthToken` or `SLACK_BOT_USER_OAUTH_TOKEN` | `SLACK_BOT_USER_OAUTH_TOKEN` |
| Failure detail limit | `maxNumberOfFailuresToShow` (default: 10) | `maxNumberOfFailures` (default: 5) |
| Flaky-test detail limit | `maxNumberOfFlakyTestsToShow` (default: 10) | `maxNumberOfFlakyTests` (default: 10) |
| Synchronous custom layout | `layout` callback | `customLayout.source` and `customLayout.functionName` |
| Asynchronous custom layout | `layoutAsync` callback | `customLayoutAsync.source` and `customLayoutAsync.functionName` |
| Environment values in metadata | Read `process.env` in the config | Use `__ENV_VARIABLE_NAME` values |

Both modes use `sendResults`, `meta`, `proxy`, and `disableUnfurl`. Bot delivery also supports `showInThread` and `sendCustomBlocksInThreadAfterIndex`. Configure exactly one Slack connection per invocation.

See [Reporter configuration](./configuration.md), [CLI and sharded runs](./cli.md), and [Custom layouts](./custom-layouts.md) for examples.
