import { test as base } from '@playwright/test';
import { WebClient } from '@slack/web-api';

type SlackClientFixture = {
  testSlackClient: SlackClient;
  testSummaryAllTestsPassed: testSummary;
};

import SlackClient, { testSummary } from '../src/SlackClient';
export const test = base.extend<SlackClientFixture>({
  testSlackClient: async ({}, use) => {
    const webClient = new WebClient('xoxb...', {});
    let fakeSlackClient: SlackClient = new SlackClient(webClient);
    await use(fakeSlackClient);
  },
  testSummaryAllTestsPassed: {
    aborted: 0,
    failed: 0,
    passed: 1,
    skipped: 0,
    failures: [],
    tests: [
      {
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
});
