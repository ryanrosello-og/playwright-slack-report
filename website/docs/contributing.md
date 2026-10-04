---
title: Contributing
description: Develop and test changes to Playwright Slack Report.
---

Clone the project and run `npm install`

Make your changes
Run the tests using `npm run pw`

**To execute and test the entire package:**

Run `npm pack`

Create a new playwright project using `yarn create playwright`
Modify the `package.json` and a local dependency to the generated `tgz` file

e.g.

```
  "dependencies": {
    "playwright-slack-report": "/home/ry/_repo/playwright-slack-report/playwright-slack-report-1.0.3.tgz"
  }
```

- Execute `npm install`
- Set your `SLACK_BOT_USER_OAUTH_TOKEN` environment variable
- Modify the `playwright.config.ts` as above
- Run the tests using `npx playwright test`

## Test the packaged consumer

Use the [consumer harness](./consumer-harness.md) to verify the installed package and CLI in isolation.

## Documentation

See the [website development guide](./website.md).

## Bugs and feature requests

[Open a GitHub issue](https://github.com/ryanrosello-og/playwright-slack-report/issues).

## License

This project is [MIT licensed](https://github.com/ryanrosello-og/playwright-slack-report/blob/main/LICENSE).
