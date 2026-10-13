# README migration checklist

This records the migration of the root README into Docusaurus. README remains a short introduction with links to the main documentation pages. Existing documentation routes remain unchanged; `docs/overview/` is new.

## Content inventory

| Original README material | Documentation destination | Status |
| --- | --- | --- |
| Product introduction and all seven feature bullets | [Overview](docs/overview.md) | Preserved and expanded into a feature inventory |
| npm and Yarn installation | [Getting started](docs/getting-started.md#install) | Preserved |
| Reporter registration, dot reporter, and webhook quick start | [Getting started](docs/getting-started.md#send-your-first-report) | Complete configuration and shell examples |
| Node/npm/Yarn consumer workflow versus Bun development | [Prerequisites](docs/getting-started.md#prerequisites), [Contributing](docs/contributing.md) | Preserved |
| LLM-friendly source map and development commands | [Contributing](docs/contributing.md), linked `llms.txt` | Preserved |
| Packaged consumer tests and GitHub Actions harness | [Consumer harness](docs/consumer-harness.md) | Existing detailed guide retained |
| Main report screenshot | [Overview](docs/overview.md), [Getting started](docs/getting-started.md) | Original image retained locally |
| Webhook creation, Slack documentation, credentials, administrator permissions | [Incoming webhooks](docs/webhooks.md) | Preserved and organized into setup steps |
| Webhook thread limitation and `slackWebHookChannel` | [Webhook capabilities](docs/webhooks.md#webhook-capabilities-and-limits) | Option retained; modern Slack channel restriction clarified |
| Bot configuration, multiple channels, token environment variable/config option | [Slack bot setup](docs/slack-bot.md) | Preserved with Bash and PowerShell commands |
| App creation, OAuth scopes, installation, authorization, token secrecy | [Slack bot setup](docs/slack-bot.md#create-and-authorize-the-slack-app) | All seven setup screenshots retained; steps visible before configuration |
| Channel visibility limitation | [Slack bot setup](docs/slack-bot.md) | Corrected using Slack's channel membership requirements |
| CLI global errors, inference precedence, status override, allowed values, exit semantics | [CLI run status](docs/cli.md#run-status-and-global-errors) | Previously missing section migrated |
| Shard merge command and JSON redirection | [CLI report generation](docs/cli.md#generate-a-json-report) | Preserved; single-run JSON generation added |
| Standalone bot CLI config and send command, required `-c`/`-j` | [CLI](docs/cli.md) | Preserved; existing corrected send syntax retained |
| CLI proxy, webhook, synchronous/asynchronous layouts, export restrictions | [CLI configuration](docs/cli.md#configuration-options) | All options and both layout functions retained |
| CLI environment metadata substitutions and full config example | [Dynamic metadata](docs/cli.md#dynamic-metadata) | Preserved |
| `channels`, `onSuccessChannels`, `onFailureChannels`, notification modes | [Reporter configuration](docs/configuration.md#options) | Preserved, including run-level failure routing and flaky rules |
| `layout`, `layoutAsync`, failure/flaky limits and actual retry semantics | [Reporter configuration](docs/configuration.md) | Preserved; global-first combined detail limit restored |
| Run-level errors, zero failed tests, empty runs, threads, forced termination caveat | [Run-level errors](docs/configuration.md#run-level-errors-and-interruptions) | Previously missing section migrated |
| Optional `SummaryResults.runStatus` and `runErrors`, ANSI stripping and success caveat | [Summary results](docs/custom-layouts.md#summary-results), [Configuration](docs/configuration.md) | Preserved with example success checks |
| Token option, log levels, unfurling, threads and thread screenshot | [Reporter configuration](docs/configuration.md) | Preserved; default/logging inconsistencies corrected |
| Custom block thread split index, proxy, metadata examples | [Reporter configuration](docs/configuration.md) | Preserved |
| Custom layout type installation, signature, import/config and Block Kit Builder link | [Custom layouts](docs/custom-layouts.md#define-a-layout) | Preserved with consistent named export/import |
| Simple summary and metadata examples with both screenshots | [Custom layout examples](docs/custom-layouts.md#examples) | Preserved; success checks now include run failures |
| Async layout, screenshot/video settings, S3 credentials/client snippet | [S3 example](docs/custom-layouts.md#screenshots-and-videos-using-aws-s3) | Existing complete implementation retained |
| Contribution, issue tracker, website guide, and MIT license links | [Contributing](docs/contributing.md) | Preserved |

## Upstream documentation updates retained

- [x] README package, download, license, coverage, and CI badges retained as project metadata.
- [x] The new README mode comparison is preserved in [Feature comparison](docs/feature-comparison.md), linked from README, the overview, and setup guide.
- [x] The [layout gallery](docs/layout-gallery.md), downloadable examples, previews, and sidebar links remain intact.

## Existing site material retained

- [x] Full S3 upload implementation and direct Slack attachment upload example.
- [x] CLI missing-environment-variable explanation and GitHub Actions workflow.
- [x] Detailed flaky-test semantics and complete callback data.
- [x] Contributor coverage, packaging, and release workflow.
- [x] Consumer harness and website development/publishing guides.
- [x] All existing documentation page routes, local screenshots, and search support.

## Corrections made during migration

- `disableUnfurl` defaults to `false`, matching `src/SlackReporter.ts`; the old README said `true`.
- Reporter logging uses `LogLevel.ERROR` or lowercase `'error'`, not uppercase `'ERROR'`.
- CLI sends use `-j filename.json`; shell redirection belongs to JSON generation.
- Complete quick-start syntax and consistent custom-layout imports replace incomplete README fragments.
- The reporter rejects webhook thread mode. Webhook examples leave it disabled; bot examples retain threads.
- Modern incoming webhooks cannot override their configured channel. The existing option remains documented without promising multi-channel support.
- Bot private-channel delivery requires membership and a channel ID; the old unconditional prohibition was inaccurate.
- Failure details combine global and test errors. Reporter and CLI defaults remain distinct (10 and 5).
- Custom success checks include run status and global errors, so zero failed tests cannot hide an unsuccessful run.

## Verification

- [x] Production Docusaurus build with the pinned Bun version and frozen website lockfile.
- [x] Docusaurus internal page, image, and anchor link validation.
- [x] Original README screenshot inventory reconciled with local documentation images.
- [x] Homepage and all ten documentation pages rendered without browser errors or broken loaded images.
- [x] Desktop and mobile layouts inspected; dark/light themes, mobile navigation, and search exercised.
- [x] Complete JSON examples parsed successfully.
- [x] `git diff --check` passed.
