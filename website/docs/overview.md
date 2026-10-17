---
title: Overview
description: What Playwright Slack Report does, its features, and how to choose a reporting workflow.
---

Playwright Slack Report sends your Playwright test results to the Slack channels where your team works. Use it as a reporter that runs with your tests, or as a CLI that publishes an existing Playwright JSON report after your CI jobs finish.

![Example Slack report](../static/img/2022-08-15_20-22-59.png)

## Features

- **Channel delivery:** send a summary through an incoming webhook, or use a Slack bot to post to one or more channels.
- **Conditional notifications:** report every run, only unsuccessful runs, or only runs containing flaky tests. Bot reports can route successful and unsuccessful runs to different channels.
- **Flaky test details:** show test names and actual retry counts, with optional `on-flaky` alerts.
- **Run-level failures:** report global errors, timeouts, and graceful interruptions, even when no individual test failed.
- **Readable details:** limit failure and flaky details, or use a bot to put them in a thread beneath the summary.
- **Build context:** include metadata such as branch, build ID, commit, and links to reports.
- **Custom layouts:** create Slack Block Kit messages with synchronous or asynchronous callbacks, including examples for screenshots and videos.
- **CLI and sharding:** publish Playwright JSON results, including one merged report from multiple shards.
- **Transport configuration:** configure proxies, logging, and link unfurling.

## Choose when to publish

| Workflow | Use it when | Start here |
| --- | --- | --- |
| Playwright reporter | You want a Slack report when a test run finishes. Configure it in `playwright.config.ts`. | [Getting started](./getting-started.md) |
| Standalone CLI | You already have JSON results, or want to merge shards and publish once from a separate CI step. It uses its own configuration file. | [CLI and sharded runs](./cli.md) |

## Choose how to connect Slack

Both workflows support webhooks and bots. Choose one connection per report.

| Capability | Incoming webhook | Slack bot |
| --- | --- | --- |
| Credentials | Webhook URL | Bot User OAuth Token |
| Destination | Channel selected when creating the webhook | One or more configured channels |
| Conditional notifications | Yes | Yes |
| Separate success/failure destinations | Use a bot for this | Reporter supports channel routing |
| Failure, global error, and flaky details | Inline | Inline or in a thread |
| Metadata and custom layouts | Yes | Yes |
| Setup guide | [Incoming webhooks](./webhooks.md) | [Slack bot setup](./slack-bot.md) |

For a detailed comparison of all four reporter/CLI and webhook/bot combinations, see [Feature comparison](./feature-comparison.md).

## Your path to a first report

1. Check [prerequisites and install the package](./getting-started.md).
2. Create a webhook or bot using the connection guides above.
3. Add the reporter configuration and run your tests.
4. Adjust [notification rules, metadata, and detail limits](./configuration.md).
5. Explore the [CLI](./cli.md) or [custom layouts](./custom-layouts.md) as your needs grow.

To work on the package itself, see [Contributing](./contributing.md), including the consumer harness and website development guides.
