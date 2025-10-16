/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test';
import { WebClient } from '@slack/web-api';
import { SummaryResults } from '../src';
// eslint-disable-next-line import/no-unresolved
import SlackClient from '../src/SlackClient';

type SlackClientFixture = {
  testSlackClient: SlackClient;
  testSummaryAllTestsPassed: SummaryResults;
  testSummaryAllTestsFailed: SummaryResults;
  testSummarySomeFlaky: SummaryResults;
};

// eslint-disable-next-line import/prefer-default-export
export const test = base.extend<SlackClientFixture>({
  testSlackClient: async ({}, use) => {
    const webClient = new WebClient('xoxb...', {});
    const fakeSlackClient: SlackClient = new SlackClient(webClient);
    await use(fakeSlackClient);
  },
  testSummaryAllTestsPassed: {
    failed: 0,
    passed: 1,
    flaky: 0,
    skipped: 0,
    failures: [],
    tests: [
      {
        file: 'tests/accounts.spec.ts',
        suiteName: 'accounts',
        name: 'overdue will incur a penalty',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        reason: '',
        retry: 0,
        status: 'passed',
      },
    ],
  },
  testSummaryAllTestsFailed: {
    failed: 1,
    passed: 0,
    flaky: 0,
    skipped: 0,
    failures: [
      {
        suite: 'tests/t1.spec.ts',
        test: 'basic test failure',
        failureReason:
          'expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n \n Error: expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
      },
    ],
    tests: [
      {
        file: 'tests/t1.spec.ts',
        suiteName: 'tests/t1.spec.ts',
        name: 'basic test failure ',
        status: 'failed',
        retry: 0,
        startedAt: '2021-12-18T09:43:16.000Z',
        endedAt: '2021-12-18T09:43:39.591Z',
        reason:
          'expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n \n Error: expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
        attachments: [
          {
            name: 'this is string',
            path: 'c:/tests/',
            contentType: 'text/plain',
            body: undefined,
          },
        ],
      },
    ],
  },
  testSummarySomeFlaky: {
    failed: 0,
    passed: 1,
    flaky: 1,
    skipped: 0,
    failures: [],
    tests: [
      {
        file: 'tests/accounts.spec.ts',
        suiteName: 'accounts',
        name: 'overdue will incur a penalty',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        reason: '',
        retry: 0,
        status: 'passed',
      },
      {
        file: 'tests/accounts.spec.ts',
        suiteName: 'accounts',
        name: 'withdrawal removes value from balance',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        reason: '',
        retry: 0,
        status: 'failed',
      },
      {
        file: 'tests/accounts.spec.ts',
        suiteName: 'accounts',
        name: 'withdrawal removes value from balance',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        reason: '',
        retry: 1,
        status: 'passed',
      },
    ],
  },
});
