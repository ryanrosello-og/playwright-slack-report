---
title: Automated releases
description: Prepare, publish, and recover package releases through GitHub Actions.
---

Merging a package version bump into `main` approves its public npm release.
The `Publish Package` workflow handles validation, publication, GitHub releases, and documentation.
It supports stable versions only.

## Release triggers

A new version in the root `package.json` creates a release candidate.
The first `main` commit containing that version identifies its source.
Later commits with the same package version do not create another release.
This includes Dependabot updates, documentation changes, and internal maintenance.

An unfinished release can resume after a later merge or manual workflow run.
The workflow retains the original release commit.
It processes pending versions in order and prevents npm's `latest` tag from moving backward.
`.github/release-records.json` records each completed publication and its archive checksum.

The initial automation merge prepares the existing unpublished version `1.1.118`.
`.github/release-config.json` identifies this starting version.

## Required checks

Each release candidate must pass these checks:

- Prettier checks for changed files.
- Lint, TypeScript checks, package build, and unit coverage on Linux and Windows.
- Documentation build, including internal link validation.
- Matching package, CLI, and release-note versions.
- The offline consumer harness against the exact archive prepared for publication.

The publisher verifies the archive checksum before using `npm publish --provenance`.
Validation and publication start from a fresh `main` checkout.
Each job verifies that its planned source belongs to `main`'s first-parent history before checking out that source.
Validation also verifies the formatting base against the source commit's first parent.
Release jobs disable shared Bun executable caching and automatic Node dependency caching.
The archive contains `gitHead`, which identifies its source commit.
Publication uses npm trusted publishing through `.github/workflows/publish.yml`.

The live Slack harness continues to run on eligible PRs and manual harness runs.
It requires both Slack secrets and sends real messages.
It is separate from the mandatory offline release check.

## Configure the release identity

The release bot needs permission to create tags, GitHub releases, and release metadata commits.
Its source edits are limited to `website/docs/release-notes.md` and `.github/release-records.json`.
GitHub grants repository permissions, so this file restriction is enforced by the release script.

1. Create a dedicated GitHub App for this repository.
2. Give the App repository **Contents: Read and write** permission.
3. Install the App on `playwright-slack-report` only.
4. Add its client ID as the repository variable `RELEASE_APP_CLIENT_ID`.
5. Add its private key as the repository secret `RELEASE_APP_PRIVATE_KEY`.
6. Keep branch protection enabled for `main`.
7. Allow the dedicated App to make release metadata commits under the applicable branch protection rules.
8. Verify that the npm trusted publisher still names this repository and `publish.yml`.

Missing App settings stop the workflow before npm publication.
The workflow also requests a token before validation to check installation permissions.
This does not prove that branch protection permits the final commit.
A blocked metadata commit produces a recoverable failure after publication.

The existing npm trusted publisher uses GitHub Actions OIDC.
A separate npm publishing token is not required.
The workflow uses Node 24, whose npm version must support trusted publishing.

See [GitHub App tokens](https://github.com/actions/create-github-app-token) and [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Prepare a release

1. Select the next stable package version.
2. Update `package.json` and the CLI `.version(...)` value together.
3. Add a matching `VERSION - Unreleased` section to the release notes.
4. Describe the consumer changes in that section.
5. Run Prettier on the changed files.
6. Run the package checks and offline consumer harness.
7. Open a PR against `main`.
8. Review the changes and required checks.
9. Merge the PR to approve publication.

After npm confirms publication, automation creates the version tag and GitHub release.
It then records npm's UTC publication date in the release notes.
The update preserves existing section anchors and maintains the rolling 12-month history.

Metadata commits use `[skip ci]` to prevent another release workflow run.
The release workflow explicitly builds and deploys GitHub Pages afterward.
Netlify remains available for PR previews.

## Recover a failed release

1. Open **Actions > Publish Package**.
2. Read the failed job and workflow summary.
3. Correct the reported infrastructure or permission problem.
4. Run **Publish Package** manually against `main`.

The workflow checks npm before attempting publication.
An existing version must match the source commit and tested archive checksum.
If npm already accepted the archive, recovery completes the remaining release steps.
An archive downloaded during recovery must also pass the offline harness.
Existing tags never move, and published versions are never overwritten.

If only website deployment failed, a new workflow run rebuilds and deploys the documentation.
The npm package remains available throughout recovery.
Failures use GitHub Actions notifications and summaries.

Release candidates retain their original source commit.
A source defect requires investigation before subsequent queued versions can publish.
Do not bypass a failed check or change a completed release record.

## Test a prepared archive locally

`HARNESS_TARBALL` selects an existing archive for the harness.
The harness installs that archive without rebuilding or repacking it.
It rejects a package name or version that differs from the source checkout.

```sh
HARNESS_TARBALL=/absolute/path/package.tgz bun run harness:offline
```

In PowerShell:

```powershell
$env:HARNESS_TARBALL = 'C:\absolute\path\package.tgz'
bun run harness:offline
Remove-Item Env:HARNESS_TARBALL
```
