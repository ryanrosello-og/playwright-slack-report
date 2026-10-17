# Repository guidance

This package sends Playwright test results to Slack through a reporter or a CLI.
It uses TypeScript and Bun for development, runtime, builds, and unit tests.
Istanbul preserves all-source coverage; Playwright under Node validates consumers.

## Project structure

- `src/SlackReporter.ts`: Playwright reporter lifecycle, configuration, and delivery routing.
- `src/ResultsParser.ts`: JSON and reporter result parsing, retries, and failure summaries.
- `src/SlackClient.ts` and `src/SlackWebhookClient.ts`: bot and webhook delivery.
- `src/LayoutGenerator.ts`: Slack blocks and fallback text.
- `cli.ts` and `src/cli/`: CLI entry point, schema, and prechecks.
- `tests/`: unit tests, fixtures, and isolated process helpers.
- `harness/`: packaged consumer integration tests; see `harness/README.md`.
- `custom_block/`: example custom layouts.

## Development and validation

- Install dependencies with `bun install --frozen-lockfile`.
- Run `bun run build` to type-check and compile the project.
- Run `bun run test:coverage` for the unit suite and coverage report in `coverage/`.
- Run targeted tests with `bun test tests/<file>.spec.ts`.
- Run `bun run lint` for source linting. Report existing failures separately from new ones.
- Use `bun run harness:offline` when changes need packaged consumer validation.
- Run `git diff --check` before finishing changes.

## Testing expectations

Add behavioral regression tests for changed logic, especially retry handling,
configuration validation, channel routing, delivery failures, and Slack's block limits.
Maintain or improve coverage; report statements, branches, functions, and lines
when working on coverage. Do not reduce coverage scope or add ignore directives
to improve the reported percentage.

Unit tests must mock Slack requests and must not require real credentials or send
messages. Restore stubs and environment variables after each test and clean up
temporary files. Keep process-isolation tests isolated when testing module loading
or global fetch behavior.

## Implementation conventions

Follow the surrounding TypeScript style and preserve public configuration and
result types. Keep bot and webhook behavior distinct where their capabilities
differ. Preserve lazy loading of proxy dependencies and test both proxy and
direct delivery when changing transport setup.

Edit source files rather than generated `dist/` output. Keep changes focused and
avoid unrelated formatting or dependency updates. Use `bun.lock` for dependency
changes. The root, consumer harness, and website each have a separate Bun lockfile.
Keep Node consumer checks and npm provenance publishing as explicit exceptions
to the Bun development runtime.

When asked to increment the package version without a specified release type,
bump the patch version in `package.json` and update the hardcoded `.version(...)`
in `cli.ts` to match. Run `bun run harness:offline` before pushing a version bump;
it checks that the packaged CLI version matches the package version.
Do not publish a release unless asked.

## Consumer release notes

Use a single hyphen (`-`) for dash punctuation in documentation and responses.
Do not use em dashes or en dashes.

For every consumer-facing feature or fix, update `website/docs/release-notes.md`
in the same change. Explain the effect on package users and any required action.
Cover reporter and CLI differences, bot and webhook differences, configuration,
compatibility, and security fixes when relevant. Omit contributor-only changes,
refactoring, and dependency updates without verified consumer impact.

Add pending changes to an `Unreleased` section above published versions. Create
that section when needed. Do not assign an unpublished change to a released version
or invent a release date. During release preparation, move the relevant entries
into the version section. Confirm npm publication and the release date before
presenting that section as published. Remove an empty `Unreleased` section.

Keep published versions newest first. Maintain a rolling 12-month window based
on the date of the release-note update. Update the page's coverage dates and
remove entries outside that window. Preserve the link to older GitHub releases.
Verify claims against source changes and published package versions. Link each
published entry to its GitHub release. Use only applicable sections: Added,
Changed, Fixed, and Upgrade instructions.

Write consumer instructions in ASD-STE100 style: use imperative verbs, one
instruction per sentence, and no more than 20 words per instructional sentence.
Put a condition before its instruction. Use consistent terms and exact option
names. Keep explanatory information separate from procedural steps.

Build the website with `bun run build` from `website/` after release-note edits.
Check links, navigation, and the rendered page. Run `git diff --check`.
