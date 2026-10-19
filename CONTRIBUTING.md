# Contributing

Small fixes, tests, documentation, and custom-layout examples are welcome.
You do not need a Slack account, token, or webhook to contribute.
Unit tests mock Slack requests. The offline consumer harness also avoids Slack traffic.

This is the authoritative contributor guide.
See the [website guide](website/docs/website.md) for documentation tooling.
See the [consumer harness guide](harness/README.md) for integration details.

## Choose a contribution

- Browse [good first issues](https://github.com/ryanrosello-og/playwright-slack-report/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22).
- Open a PR directly for a small fix or documentation improvement.
- For a larger feature or public API change, open an issue before implementation.
- If you need help, open a draft PR and explain where you are stuck.

A related issue is optional for small changes.
Comment on an existing issue to coordinate work with other contributors.

## Get your first test passing

Install Git and the Bun version in [.bun-version](.bun-version).
Use the [Bun installation guide](https://bun.com/docs/installation) for your operating system.
Confirm the installed version with `bun --version`.

Fork this repository on GitHub.
Replace `YOUR-USERNAME` with your GitHub username.

```sh
git clone https://github.com/YOUR-USERNAME/playwright-slack-report.git
cd playwright-slack-report
git remote add upstream https://github.com/ryanrosello-og/playwright-slack-report.git
git fetch upstream
git switch -c my-contribution
bun install --frozen-lockfile
bun test
```

The initial unit suite does not need Node, browser downloads, or website dependencies.

## Optional: use a development container

[Open in GitHub Codespaces](https://codespaces.new/ryanrosello-og/playwright-slack-report)
or use VS Code with Docker and the Dev Containers extension.
For local use, open your clone and select **Dev Containers: Reopen in Container**.

The container provides Node 24, installs Bun from `.bun-version`, and installs root dependencies.
It also enables Prettier formatting on save.
It does not install browsers or website dependencies during setup.
After setup, run `bun test`.
Use a writable fork or branch when submitting your changes.

## Develop and check a change

Edit source files rather than generated `dist/` output.
Keep changes focused.
For a fast feedback loop, run the relevant test file:

```sh
bun test tests/ProxyConfiguration.spec.ts
```

After your final edits, format the changed files and run the shared checks:

```sh
bun run format
bun run check
git diff --check
```

`bun run check` runs formatting checks, lint, full type checking, build, and unit coverage.
CI uses this same command on Windows and Linux.
The separate type check includes tests, scripts, and examples that the package build does not compile.

Formatting covers changed files since the merge base with `upstream/main`, then `origin/main`, then local `main`.
Equivalent `master` refs are fallbacks.
It includes committed changes, staged changes, unstaged changes, and untracked files that Git does not ignore.
Deleted files, generated output, unsupported formats, and the intentionally malformed JSON fixture are excluded.
Unchanged legacy files do not block your contribution.

If no base branch exists locally, the formatter warns and checks only uncommitted files.
Fetch the base branch to include committed changes.
For another target branch, set `FORMAT_BASE_REF` to its Git ref before running formatting or checks.
CI supplies the PR base or previous push commit explicitly.

To format or check specific files, use explicit paths:

```sh
bun --bun x prettier --write src/ResultsParser.ts tests/ResultsParser.spec.ts
bun --bun x prettier --check src/ResultsParser.ts tests/ResultsParser.spec.ts
```

## Run additional checks when needed

| Change                                                               | Additional validation                                                               |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Package contents, reporter/CLI integration, or runtime compatibility | Run `bun run harness:offline`.                                                      |
| Website documentation, navigation, or release notes                  | Install website dependencies and build the website. Check rendered pages and links. |
| Isolated unit behavior                                               | Run its focused tests during development, then `bun run check`.                     |

The offline harness needs Node 24 or newer.
It installs Chromium automatically and downloads dependencies when needed.
On Linux, browser system dependencies can require administrator access.
"Offline" means no Slack traffic; initial package and browser installation still needs network access.

For website changes:

```sh
cd website
bun install --frozen-lockfile
bun run build
bun run serve
```

Check the changed pages, links, and navigation in the preview.
Return to the repository root before running package commands.
See the [website development guide](website/docs/website.md) for preview details.

## Find the relevant code

| Area                               | Files                                             |
| ---------------------------------- | ------------------------------------------------- |
| Reporter lifecycle and routing     | `src/SlackReporter.ts`                            |
| Results, retries, and failures     | `src/ResultsParser.ts`                            |
| Bot and webhook delivery           | `src/SlackClient.ts`, `src/SlackWebhookClient.ts` |
| Slack blocks and fallback text     | `src/LayoutGenerator.ts`                          |
| CLI options, schema, and prechecks | `cli.ts`, `src/cli/`                              |
| Hosted artifact links              | `src/ArtifactLinks.ts`                            |
| Unit tests and fixtures            | `tests/`                                          |
| Packaged consumer validation       | `harness/`                                        |
| Custom-layout examples             | `custom_block/`                                   |
| Documentation website              | `website/`                                        |

## Tests and dependencies

Add behavioral regression tests for changed logic.
Mock Slack requests in unit tests.
Restore stubs and environment variables after each test.
Clean up temporary files.
Keep module-loading and global-fetch tests isolated in their existing process helpers.
Preserve the different capabilities of bots and webhooks.
For transport changes, test direct and proxy delivery.

Coverage includes every `src/**/*.ts` file and merges isolated-process results.
Reports in `coverage/` include statements, branches, functions, lines, and `lcov.info`.
The thresholds in `coverage-thresholds.json` are enforced.
Do not narrow coverage scope or add ignore directives to raise percentages.

The root, `harness/`, and `website/` have separate `bun.lock` files.
For dependency changes, run `bun install` in the relevant directory and commit that lockfile.
Keep unrelated dependency updates out of your PR.

## Submit a PR

Push your branch to your fork.
Open a PR against `main`.
Describe the problem, resulting behavior, and validation results.
If a check fails, include its output and explain whether it fails before your changes.
Use a draft PR when work is incomplete or you need guidance.
When the work is ready, request review through GitHub.

For consumer features or fixes, add an `Unreleased` entry in [release notes](website/docs/release-notes.md).
Explain the effect on users and any required action.
Omit contributor-only changes and internal refactoring without consumer impact.
Use applicable sections: Added, Changed, Fixed, and Upgrade instructions.
Use a single hyphen for dash punctuation.
Use imperative verbs for instructions.
Give one instruction per sentence, with no more than 20 words.
Put conditions before instructions.
Use exact option names and consistent terms.
Keep explanatory information separate from procedural steps.

Maintainers handle live Slack verification, version bumps, and publishing.
Fork PRs run the consumer harness without Slack credentials.
Never include credentials or `.env` files in a PR.

## Review and issue follow-up

PRs are not automatically closed for inactivity.
Accepted work, starter issues, and issues assigned to milestones are exempt from automatic closure.
Only issues labeled `needs-info` receive an inactivity reminder after 30 days.
They close after another 14 days without a response.
A reply removes the stale and `needs-info` labels for maintainer review.
If an issue closes, provide the missing details and ask a maintainer to reopen it.

Maintainers: request specific missing information before applying `needs-info`.
Mark accepted bugs and planned enhancements with `accepted`.
The `accepted`, `good first issue`, and `help wanted` labels exempt issues from inactivity handling.
Remove `needs-info` when the requested information is available.

## Maintainer release preparation

Move relevant pending notes into the version section during release preparation.
Verify claims against the source and published package versions.
Confirm npm publication and the release date before marking the version as published.
Link each published entry to its GitHub release.
Keep published versions newest first.
Remove an empty `Unreleased` section.
Maintain a rolling 12-month history and update the page's coverage dates.
Preserve the link to older GitHub releases.
Build the website and inspect the release-note page after edits.

Run `bun run harness:offline` before pushing a version bump.
The release workflow builds with Bun and uses `npm publish --provenance` for publishing.
Publishing requires an intentional release tag.
