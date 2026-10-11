import { beforeEach, afterEach, test, expect } from 'bun:test';
import sinon from 'ts-sinon';
import SlackReporter from '../src/SlackReporter';
import SlackClient from '../src/SlackClient';
import SlackWebhookClient from '../src/SlackWebhookClient';

let previousToken: string | undefined;
beforeEach(() => {
  previousToken = process.env.SLACK_BOT_USER_OAUTH_TOKEN;
  delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
});
afterEach(() => {
  sinon.restore();
  if (previousToken === undefined) delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
  else process.env.SLACK_BOT_USER_OAUTH_TOKEN = previousToken;
});

function reporter(options: any, outcomes: string[] = ['expected']) {
  const instance = new SlackReporter();
  instance.onBegin({ projects: [], reporter: [['SlackReporter', options]] } as any,
    { allTests: () => outcomes.map(outcome => ({ outcome: () => outcome })) } as any);
  return instance;
}

test('reporter sends failures to failure channels and attaches details to every returned thread', async () => {
  const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([
    { channel: 'failure-one', outcome: 'ok', ts: 'one' },
    { channel: 'failure-two', outcome: 'ok', ts: 'two' },
  ]);
  const attach = sinon.stub(SlackClient.prototype, 'attachDetailsToThread').resolves([]);
  const instance = reporter({
    slackOAuthToken: 'unit-test', sendResults: 'on-failure',
    onFailureChannels: ['failure-one', 'failure-two'], onSuccessChannels: ['success'],
    showInThread: true, meta: [{ key: 'build', value: '42' }],
  }, ['unexpected']);
  instance.onTestEnd({ parent: { title: 'suite' }, title: 'test', _projectId: 'missing', retries: 0,
    results: [{ status: 'failed', retry: 0, startTime: new Date('2026-01-01'), duration: 1,
      errors: [{ message: 'failure' }] }],
  } as any, {} as any);
  await instance.onEnd();
  expect(send.firstCall.args[0].options).toMatchObject({
    channelIds: ['failure-one', 'failure-two'], showInThread: true,
    summaryResults: { failed: 1, meta: [{ key: 'build', value: '42' }] },
  });
  expect(attach.callCount).toBe(2);
  expect(attach.firstCall.args[0]).toMatchObject({ channelIds: ['failure-one'], ts: 'one' });
  expect(attach.secondCall.args[0]).toMatchObject({ channelIds: ['failure-two'], ts: 'two' });
});

test('reporter sends successful results through the webhook with custom layout options', async () => {
  const send = sinon.stub(SlackWebhookClient.prototype, 'sendMessage').resolves({ outcome: 'ok' });
  const layoutAsync = async () => [];
  await reporter({ slackWebHookUrl: 'https://example.invalid/webhook', sendResults: 'always',
    layoutAsync, disableUnfurl: true, maxNumberOfFailuresToShow: 0,
  }).onEnd();
  expect(send.firstCall.args[0]).toMatchObject({
    customLayoutAsync: layoutAsync, disableUnfurl: true, maxNumberOfFailures: 0,
    summaryResults: { passed: 1, failed: 0 },
  });
});

test('reporter routes successful results to success channels', async () => {
  const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([]);
  await reporter({ slackOAuthToken: 'unit-test', onSuccessChannels: ['success'],
    onFailureChannels: ['failure'], sendResults: 'always',
  }).onEnd();
  expect(send.firstCall.args[0].options.channelIds).toEqual(['success']);
});

test('reporter forwards custom block threading configuration', async () => {
  const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([]);
  await reporter({ slackOAuthToken: 'unit-test', channels: ['success'],
    sendCustomBlocksInThreadAfterIndex: 2,
  }).onEnd();
  expect(send.firstCall.args[0].options.sendCustomBlocksInThreadAfterIndex).toBe(2);
});

test('reporter rejects conflicting transports and missing failure channels', () => {
  expect(reporter({ slackOAuthToken: 'unit-test', slackWebHookUrl: 'https://example.invalid/webhook',
    channels: ['success'],
  }).preChecks()).toMatchObject({ okToProceed: false, message: expect.stringContaining('single option') });
  expect(reporter({ slackOAuthToken: 'unit-test', sendResults: 'on-failure',
    onFailureChannels: [],
  }).preChecks()).toMatchObject({ okToProceed: false, message: expect.stringContaining('failed tests') });
});

test('reporter skips an empty suite and passing tests in on-failure mode', async () => {
  const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([]);
  const empty = reporter({ slackOAuthToken: 'unit-test', channels: ['channel'], sendResults: 'always' }, []);
  await empty.onEnd();
  expect(empty.logs).toEqual(['⏩ Slack reporter - Playwright reported : "No tests found"']);
  const passing = reporter({ slackOAuthToken: 'unit-test', channels: ['channel'], sendResults: 'on-failure' });
  await passing.onEnd();
  expect(passing.logs).toEqual(['⏩ Slack reporter - no failures found']);
  expect(send.called).toBe(false);
});

test('reporter rejects a non-function async layout', () => {
  const instance = reporter({ slackOAuthToken: 'unit-test', channels: ['channel'], layoutAsync: 'invalid' });
  expect(instance.preChecks()).toEqual({ okToProceed: false, message: '❌ customLayoutAsync is not a function' });
  expect(instance.printsToStdio()).toBe(false);
  instance.log(undefined);
  expect(instance.logs).toEqual([]);
});
