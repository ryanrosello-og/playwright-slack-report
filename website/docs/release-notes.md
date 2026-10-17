---
title: Release Notes
description: Consumer changes, fixes, and upgrade instructions for Playwright Slack Report.
toc_min_heading_level: 2
toc_max_heading_level: 2
---

These notes cover changes that affect package users from **18 October 2025 to 18 October 2026**.
The newest release appears first. Releases with only internal maintenance changes are omitted.
Each published entry links to its GitHub release. Older history is available in [all GitHub releases](https://github.com/ryanrosello-og/playwright-slack-report/releases).

## 1.1.118 - Unreleased {#v11118}

Version 1.1.118 is prepared for release. It is not yet published.

### Added

- Reporter and CLI configurations support `artifactLinks` for hosted screenshots, traces, other attachments, and HTML reports beside failures.
- Bot reports include these links in failure threads when enabled. Webhook reports show links inline.
- Custom layouts receive optional `failures[].artifacts` entries with names, URLs, and content types when available.
- The [failure artifacts template](./layout-gallery.md#5-failure-artifacts) provides a preview, downloadable TypeScript and Block Kit JSON, and setup examples.
- Attachment paths outside the configured upload directory are omitted. Oversized links are omitted with a notice in default layouts.

### Fixed

- Failure details keep same-named tests separate across files, projects, and repetitions, so each failure retains its own artifacts.

### Upgrade instructions

Upload the artifacts to your host with their directory structure intact.
Set `artifactLinks.baseUrl` to the uploaded directory URL.
Set `artifactLinks.pathPrefix` to the corresponding local directory.
To add the HTML report, set `artifactLinks.reportUrl` to its hosted URL.

The package does not upload files or change access permissions. Existing configurations require no changes.
Links use the final failing attempt's attachments and follow the failure display limit.
Reporter and CLI option names are identical. CLI paths resolve from its working directory.

[Reporter options](./configuration.md#artifactlinks) · [CLI options](./cli.md#hosted-artifact-links)

## 1.1.117 - 11 October 2026

### Added

- Slack reports show flaky test names, projects, and actual retry counts. Each test appears once per project and repetition.
- The reporter and CLI support `sendResults: 'on-flaky'`. This sends a report only when the run contains flaky tests.
- Flaky details have a separate display limit. The reporter uses `maxNumberOfFlakyTestsToShow`; the CLI uses `maxNumberOfFlakyTests`. Both default to 10.
- Custom layouts receive the complete optional `flakyTests` array, including test names, files, projects, and retry counts.

### Upgrade instructions

For alerts about flaky tests, set `sendResults` to `on-flaky`.
This setting skips runs with failures but no flaky tests. The existing `on-failure` setting still skips runs with only flaky tests.

To hide flaky details, set the applicable display limit to `0`.
The flaky count and notification rules remain active.

For bot reports with threaded details, set `showInThread` to `true`.
Webhook reports show details in the main message.

[Reporter options](./configuration.md#maxnumberofflakyteststoshow) · [CLI options](./cli.md#flaky-test-alerts) · [GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.117)

## 1.1.116 - 10 October 2026

### Fixed

- Failure notifications include global errors, timeouts, and graceful interruptions, even when no individual test failed.
- The default layout shows an unsuccessful run status. Global errors appear separately and do not increase the failed-test count.
- Bot reports route unsuccessful runs to `onFailureChannels` when configured.

### Added

- Custom layouts receive the optional `runStatus` and `runErrors` fields.
- The CLI accepts `--run-status` with `passed`, `failed`, `timedout`, or `interrupted`. Playwright JSON does not contain the overall run status.

### Upgrade instructions

If you use a custom layout, check `runStatus` and `runErrors` when you determine success.
Do not use `failed === 0` as the only success condition.
The [custom layout example](./custom-layouts.md#summary-results) includes these checks.

If your runner detects a global timeout, add `--run-status timedout` to the CLI command.
Without this option, the CLI infers the status from available errors and test results.

Notifications require Playwright to complete the reporter callback. Forced process termination can prevent delivery.

[Run errors](./configuration.md#run-level-errors-and-interruptions) · [CLI run status](./cli.md#run-status-and-global-errors) · [GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.116)

## 1.1.115 - 10 October 2026

### Added

The documentation website provides setup, configuration, and troubleshooting guidance for package users.
It includes [webhook setup](./webhooks.md), [bot setup](./slack-bot.md), [CLI usage](./cli.md), and [custom layouts](./custom-layouts.md).
No configuration change is required to use the documentation.

[GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.115)

## 1.1.114 - 4 October 2026

### Fixed

Bot delivery no longer produces unreadable Slack API responses caused by proxy dependency loading in version 1.1.113.
The problem could affect connections without a proxy. The proxy dependency now loads only when a proxy is configured.

### Upgrade instructions

If version 1.1.113 produces unreadable Slack API responses, install version 1.1.114 or later.
Keep your existing bot and proxy settings.

[Installation](./getting-started.md#install) · [Fix details](https://github.com/ryanrosello-og/playwright-slack-report/pull/451) · [GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.114)

## 1.1.113 - 22 August 2026

### Added

Custom layouts can read Playwright test tags from the optional `tags` field on each `SummaryResults.tests` entry.
Tags are available through both the reporter and the CLI. This supports layouts that group or identify tests by tag.

### Upgrade instructions

To display tags, read each test's `tags` field in your custom layout.
If the field is absent, use an empty array.

[Custom layouts](./custom-layouts.md#summary-results) · [GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.113)

## 1.1.110 - 14 April 2026

### Fixed

The Slack client dependency uses patched Axios versions to address reported security issues in its HTTP dependency.
This change updates the dependencies installed with the package. It does not require changes to your Slack configuration.

### Upgrade instructions

If you use an earlier version, install version 1.1.110 or later.
Update your project's lockfile with your package manager.

[Installation](./getting-started.md#install) · [Dependency fix](https://github.com/ryanrosello-og/playwright-slack-report/pull/387) · [GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.110)

## 1.1.106 - 14 February 2026

### Changed

The package no longer installs the unused `ts-node` runtime dependency or the `diff` dependency through that path.
This reduces the dependencies needed by package users. Other packages in your project can still depend on those libraries.
Your reporter and CLI configuration can stay the same.

[Dependency change](https://github.com/ryanrosello-og/playwright-slack-report/pull/361) · [GitHub release](https://github.com/ryanrosello-og/playwright-slack-report/releases/tag/v1.1.106)
