import { test as base, expect } from '@playwright/test';
import SlackClient from '../src/SlackClient';
import { mock, instance, when } from 'ts-mockito';
import { ChatPostMessageResponse, WebClient } from '@slack/web-api';

type SlackClientFixture = {
  fakeSlackClient: SlackClient
  stubbedSlackClient: SlackClient
};

export const test = base.extend<SlackClientFixture>({
  fakeSlackClient: async ({ }, use) => {
    let mockedClient: WebClient = mock(WebClient);
    let client: WebClient = instance(mockedClient);

    let fakeSlackClient: SlackClient = new SlackClient(new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {

    }))
    await use(fakeSlackClient);
  },
  stubbedSlackClient: async ({ }, use) => {
    let mockedClient: SlackClient = mock(SlackClient);
    let response: ChatPostMessageResponse = { ok: true }
    when(mockedClient.doPostRequest('test' ,[])).thenResolve(response);
    let client: SlackClient = instance(mockedClient);
    await use(client);
  },
});

test('SlackClient.generateBlocks() creates blocks with correct stats summary', async ({ fakeSlackClient }) => {
  let generatedBlock = await fakeSlackClient.generateBlocks({
    aborted: 1, failed: 1, passed: 1, skipped: 1,
    failures: [
      { test: 'test', failureReason: 'message' },
    ],
    tests: [

    ]
  });
  expect(generatedBlock).toEqual([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":white_check_mark: *1* Tests ran successfully \n\n :red_circle: *1* Tests failed \n\n :fast_forward: *1* skipped \n\n :exclamation: *1* aborted",
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*test*\n          \n\n>message",
      },
    },
  ])
})

test('SlackClient.generateBlocks() creates blocks when meta provided', async ({ fakeSlackClient }) => {
  let generatedBlock = await fakeSlackClient.generateBlocks({
    aborted: 0, failed: 0, passed: 1, skipped: 1,
    failures: [],
    tests: [

    ],
    meta: [{
      key: 'BuildID', value: '9sdcv-312432-3134'
    }]
  });
  expect(generatedBlock).toEqual([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":white_check_mark: *1* Tests ran successfully \n\n :red_circle: *0* Tests failed \n\n :fast_forward: *1* skipped \n\n ",
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "\n*BuildID* :\t9sdcv-312432-3134",
      },
    },
    {
      type: "divider",
    },
  ])
})

test('SlackClient.generateBlocks() creates blocks when test with attachment is provided', async ({ fakeSlackClient }) => {
  let generatedBlock = await fakeSlackClient.generateBlocks({
    aborted: 0, failed: 1, passed: 0, skipped: 1,
    failures: [],
    tests: [
      {
        suiteName: 'accounts',
        name: 'overdue will incur a penalty',
        browser: 'chrome',
        endedAt: new Date().toISOString(),
        reason: '',
        retry: 2,
        startedAt: new Date().toISOString(),
        status: 'passed',
        attachments: [{
          body: 'www.google.com',
          contentType: 'text/html',
          name: 'test',
          path: 'c:/test.html',
        }
        ]
      }
    ],
  });
  expect(generatedBlock).toEqual([
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":white_check_mark: *0* Tests ran successfully \n\n :red_circle: *1* Tests failed \n\n :fast_forward: *1* skipped \n\n ",
      },
    },
    {
      type: "divider",
    },
  ])
})

test('SlackClient.sendMessage() ', async ({ stubbedSlackClient }) => {
  let result = await stubbedSlackClient.sendMessage({
    channelIds: ['test'], summaryResults: {
      aborted: 1, failed: 1, passed: 1, skipped: 1,
      failures: [
        { test: 'test', failureReason: 'message' },
      ],
      tests: [

      ]
    }, customLayout: undefined
  });
  console.log('🪵 -----------------------------------------------------------------🪵');
  console.log('🪵 > file: SlackClient.spec.ts > line 143 > test > result', result);
  console.log('🪵 -----------------------------------------------------------------🪵');
})