---
title: Contributing
description: Develop and test changes to Playwright Slack Report.
---

Install the Bun version pinned in `.bun-version`, then run from the repository root:

```sh
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run build
bun test
bun run test:coverage
```

Run a single file with `bun test tests/ProxyConfiguration.spec.ts`. Unit tests mock Slack and do not require credentials. The existing `bun run pw` command is an alias for the coverage suite.

The package, `harness/`, and `website/` each keep their own `bun.lock`. Run `bun install` in the dependency root you are changing and commit its updated lockfile. CI uses frozen installs and the pinned Bun version on Windows and Linux.

Bun emits Node-compatible CommonJS JavaScript at the existing `dist/` paths. TypeScript, running under Bun, checks types and emits declaration files. The published CLI retains its Node shebang; package consumers can continue using Node, npm, Yarn, and Playwright without changing their setup.

## Coverage

`bun run test:coverage` runs `bun test` with Istanbul instrumentation. It includes every `src/**/*.ts` file, including unloaded files, and merges coverage from isolated CLI and proxy processes. Reports in `coverage/` include statements, branches, functions, lines, and `lcov.info` for Coveralls. `coverage-thresholds.json` enforces the pre-migration minimum percentages.

Instrumentation measures TypeScript source directly, so counter totals differ from the old NYC report, which also counted compiler-generated JavaScript. Do not narrow the source scope or add ignore directives to raise coverage.

## Packaging and releases

Run `bun pm pack` to create a local tarball. The release workflow installs and builds with Bun, then uses `npm publish --provenance` to preserve release provenance. Publishing still requires an intentional release tag.

## Test the packaged consumer

Use `bun run harness:offline` and the [consumer harness](./consumer-harness.md) to verify the installed package and CLI in isolation. Node 24+ is required for these consumer compatibility checks; `HARNESS_NODE` can select an explicit Node executable. Bun orchestrates the harness while the real Playwright runner and installed CLI execute under Node.

## Documentation

See the [website development guide](./website.md).

## Bugs and feature requests

[Open a GitHub issue](https://github.com/ryanrosello-og/playwright-slack-report/issues).

## License

This project is [MIT licensed](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/LICENSE).
