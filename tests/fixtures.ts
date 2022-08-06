import { test as base } from '@playwright/test';
import { WebClient } from '@slack/web-api';

type SlackClientFixture = {
  testSlackClient: SlackClient
};

import SlackClient from '../src/SlackClient';
export const test = base.extend<SlackClientFixture>({
  testSlackClient: async ({ }, use) => {
    const webClient = new WebClient('xoxb...', {})
    let fakeSlackClient: SlackClient = new SlackClient(webClient)
    await use(fakeSlackClient);
  },
});