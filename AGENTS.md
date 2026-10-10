# Repository guidance

This package sends Playwright test results to Slack through a reporter or a CLI.
It uses TypeScript, Yarn Classic, Playwright Test, and nyc for coverage.

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

- Install dependencies with `yarn install --frozen-lockfile`.
- Run `yarn build` to type-check and compile the project.
- Run `yarn pw` for the unit suite and coverage report in `coverage/`.
- Run targeted tests with `yarn playwright test tests/<file>.spec.ts --reporter=dot`.
- Run `yarn lint` for source linting. Report existing failures separately from new ones.
- Use `yarn harness:offline` when changes need packaged consumer validation.
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
avoid unrelated formatting or dependency updates. Use `yarn.lock` for root
dependency changes; the consumer harness has its own npm lockfile.

When asked to increment the package version without a specified release type,
bump the patch version in `package.json` and update the hardcoded `.version(...)`
in `cli.ts` to match. Run `yarn harness:offline` before pushing a version bump;
it checks that the packaged CLI version matches the package version.
Do not publish a release unless asked.
