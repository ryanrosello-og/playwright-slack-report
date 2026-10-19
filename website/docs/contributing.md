---
title: Contributing
description: Find the contributor quick start, checks, and pull request guidance.
---

Fixes, tests, documentation, and custom-layout examples are welcome.
You do not need a Slack account, token, or webhook to contribute.

Start with the [contributor guide](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/CONTRIBUTING.md) in the repository.
It is the authoritative source for setup, the shared check command, the source map, and PR expectations.
It also explains the optional development container and GitHub Codespaces setup.

Browse [good first issues](https://github.com/ryanrosello-og/playwright-slack-report/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22) for scoped starting points.
Small fixes do not require an issue first.
Draft PRs and questions are welcome.
For larger features, open an issue before implementation.

## Detailed guides

- [Website development](./website.md): Local documentation previews, builds, and publishing.
- [Consumer harness](./consumer-harness.md): Packaged reporter and CLI checks, including offline execution.
- [Automated releases](./releasing.md): Release setup, validation, publication, and recovery.
- [Release notes](./release-notes.md): Consumer changes and upgrade instructions.

Maintainers handle live Slack verification, version bumps, and publishing.
Fork PRs use the offline consumer harness without Slack credentials.

Merging a stable package version bump into `main` approves publication after the release checks pass.
Dependency-only updates do not create a new package version.
