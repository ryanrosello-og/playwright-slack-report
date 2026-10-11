---
title: Layout gallery
description: Four ready-to-adapt custom Slack layouts with screenshots, source code, and Block Kit payloads.
---

Start with one of these four layouts and adapt it to your team's Slack channel. Each is a synchronous function that receives `SummaryResults` and returns Slack blocks. They work with reporter webhook and bot delivery.

The screenshots below are **local previews rendered from the examples' actual Block Kit output using sample data**. They illustrate the content and arrangement; Slack's fonts and spacing may differ. No Slack messages are sent when generating these previews.

## 1. Build summary

**Function:** `generateBuildSummary` · **Best for:** a busy CI channel.

Four fields put passed, failed, flaky, and skipped counts first. Branch and build context sit below the counts, followed by links to the report and CI run. The heading reflects run failures, timeouts, and interruptions, even when no individual test failed.

![Build summary preview with 128 passed tests, no failures or flaky tests, two skipped tests, branch and build context, and report links](../static/img/layouts/build-summary.png)

[Download Block Kit JSON](pathname:///playwright-slack-report/examples/layouts/build-summary.json)

## 2. Failure triage

**Function:** `generateFailureTriage` · **Best for:** investigating a broken build.

Show up to two global run errors and three test failures, including the test, suite, and a shortened error message. An omission count points readers to the full report when more details are available. A run failure with no recorded details still keeps its failed status visible.

![Failure triage preview showing a checkout confirmation timeout and a password reset service error](../static/img/layouts/failure-triage.png)

[Download Block Kit JSON](pathname:///playwright-slack-report/examples/layouts/failure-triage.json)

## 3. Flaky test watch

**Function:** `generateFlakyWatch` · **Best for:** a test reliability channel.

List up to four flaky tests with suite, project, and actual retry counts. This uses `flakyTests` rather than guessing from failures or configured retry limits. Use `sendResults: 'on-flaky'` if you only want notifications for runs containing flaky tests. The overall run status remains visible for runs that also have failures.

![Flaky test watch preview with three flaky tests across Chromium, WebKit, and Firefox and four retries](../static/img/layouts/flaky-watch.png)

[Download Block Kit JSON](pathname:///playwright-slack-report/examples/layouts/flaky-watch.json)

## 4. Run context

**Function:** `generateRunContext` · **Best for:** sharing a run with another team.

Combine the outcome and counts with environment, branch, commit, build, owner, and suite. Report and CI links help teammates find the right artifacts without searching the channel. Missing metadata displays as “Not supplied”.

![Run context preview showing staging environment, release branch, commit, build, owner, suite, and artifact links](../static/img/layouts/run-context.png)

[Download Block Kit JSON](pathname:///playwright-slack-report/examples/layouts/run-context.json)

## Use an example

[Download showcase.ts](pathname:///playwright-slack-report/examples/layouts/showcase.ts) and save it in your project. The file contains all four functions and their shared helpers. Install `@slack/types` as a development dependency if needed, then select a function in `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import { generateBuildSummary } from './showcase';

export default defineConfig({
  reporter: [
    ['dot'],
    ['playwright-slack-report/dist/src/SlackReporter.js', {
      slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
      sendResults: 'always',
      layout: generateBuildSummary,
      meta: [
        { key: 'Environment', value: 'Staging / EU West' },
        { key: 'Branch', value: process.env.GITHUB_REF_NAME || 'local' },
        { key: 'Build', value: process.env.GITHUB_RUN_NUMBER || 'local' },
        { key: 'Commit', value: process.env.GITHUB_SHA || 'local' },
        { key: 'Owner', value: 'Checkout team' },
        { key: 'Suite', value: 'Nightly regression' },
        { key: 'Report URL', value: 'https://example.com/reports/1842' },
        { key: 'Build URL', value: 'https://example.com/builds/1842' },
      ],
    }],
  ],
});
```

Replace the example URLs with your own report and CI links. Optional links are omitted if they are missing or invalid. Metadata keys are case-sensitive. For bot delivery, replace `slackWebHookUrl` with `channels: ['ci-results']` and supply `SLACK_BOT_USER_OAUTH_TOKEN`.

These custom layouts show details inline and impose their own limits. The reporter's default-layout detail limits do not trim custom output. Keep `showInThread` off for the pictured result; see [custom layouts](./custom-layouts.md) and [reporter configuration](./configuration.md) for other arrangements.

## Adapt and preview

Open a downloaded JSON payload in [Slack's Block Kit Builder](https://app.slack.com/block-kit-builder/) to inspect it with Slack's renderer. The examples use [headers](https://docs.slack.dev/reference/block-kit/blocks/header-block/), [sections and fields](https://docs.slack.dev/reference/block-kit/blocks/section-block/), dividers, and context blocks. Dynamic names, errors, and metadata use plain text; the report links use Slack's link formatting.

For the CLI, compile `showcase.ts` to CommonJS (for example, `bun build ./showcase.ts --target=node --format=cjs --outfile=./showcase.cjs`), then set `customLayout.source` to `./showcase.cjs` and `customLayout.functionName` to the chosen exported function. See [CLI configuration](./cli.md).

Contributors can regenerate the screenshots, sample JSON, and downloadable source from the repository root:

```sh
bun install --frozen-lockfile
bun --bun x playwright install chromium
bun scripts/layout-previews.ts
```

Edit `custom_block/showcase.ts` for the layouts and `scripts/layout-preview-data.ts` for the sample data. The preview script only renders the block types used in this gallery; it is not a general Slack renderer. It runs locally without Slack credentials.
