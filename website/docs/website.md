---
title: Website development
description: Run, build, and publish the documentation website.
---

The documentation lives in `website/`, with its own dependencies and `bun.lock`. Install and execute Docusaurus with Bun.

## Run locally

Use the Bun version pinned in the repository’s `.bun-version`, matching the documentation workflow:

```sh
cd website
bun install --frozen-lockfile
bun run start
```

Open the local URL printed by Docusaurus. Edit pages in `docs/`, navigation in `sidebars.js`, the homepage in `src/pages/index.jsx`, and shared styling in `src/css/custom.css`.

## Check the production site

```sh
bun run build
bun run serve
```

The build fails for broken links. Local search is generated during the production build; use the production preview to test it. Check desktop and mobile layouts, both color modes, navigation, and search before submitting changes.

Images live in `static/img/`. In documentation Markdown, use a relative import such as `../static/img/threads.png` so Docusaurus handles the GitHub Pages base path.

## Publish to GitHub Pages

The site is configured for [ryanrosello-og.github.io/playwright-slack-report](https://ryanrosello-og.github.io/playwright-slack-report/).

In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. This is a one-time repository setting and requires repository administration access.

The `Documentation` workflow builds documentation changes on pull requests. Changes to `website/` or the workflow on `main` build and deploy the site. You can also run the workflow manually from `main`. Within this workflow, pull requests and manual runs on other branches only build; they do not deploy.

The workflow uses GitHub's Pages artifact and deployment actions, with deployment permissions restricted to the deploy job. No separate deployment branch, external search account, or custom domain is required.

## Preview pull requests with Netlify

Netlify deploys documentation previews through its GitHub repository connection. GitHub Pages hosts the published documentation. Netlify settings are managed in the Netlify dashboard, independently of the `Documentation` workflow.

With Deploy Previews enabled, pull requests against `main` trigger preview builds. Each new commit updates the preview after a successful build. The Netlify status check on the pull request contains the preview link. If deploy notifications are enabled, Netlify also adds a comment with the link.

1. Push your documentation changes to the pull request branch.
2. Wait for the Netlify status check to pass.
3. Open the preview link from the Netlify status check.
4. Check the changed pages, navigation, images, and downloads.
5. If the preview requires authentication, sign in with an account that has project access.

The preview uses the existing `/playwright-slack-report/` path. The Netlify build publishes `website/build`, with the generated site inside `playwright-slack-report/`. A redirect opens that path from the preview root.

For configuration and troubleshooting, see [Netlify Deploy Previews](https://docs.netlify.com/deploy/deploy-types/deploy-previews/).

## Keep documentation authoritative

Maintain detailed guidance here. Keep the repository README brief and link to the relevant documentation. `harness/README.md` points to the consumer harness page instead of duplicating it. Documentation currently covers the current release without separate version snapshots.
