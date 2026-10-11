import { afterEach, expect, test } from 'bun:test';
import { WebClient } from '@slack/web-api';
import { IncomingWebhook } from '@slack/webhook';
import sinon from 'ts-sinon';
import SlackClient from '../src/SlackClient';
import SlackWebhookClient from '../src/SlackWebhookClient';
import { SummaryResults } from '../src';
import { generateBlocks, generateFallbackText, generateFailures } from '../src/LayoutGenerator';

const summary: SummaryResults = {
  passed: 2, failed: 1, flaky: 0, skipped: 0, tests: [],
  failures: [{ suite: 'checkout', test: 'payment', failureReason: 'declined' }],
};
const options = {
  channelIds: ['first', 'second'], customLayout: undefined,
  customLayoutAsync: undefined, maxNumberOfFailures: 10,
  summaryResults: summary, showInThread: false,
};

afterEach(() => sinon.restore());

test('missing channels reject before any Slack request', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage');
  await expect(new SlackClient(web).sendMessage({ options: { ...options, channelIds: undefined } }))
    .rejects.toThrow('Channel ids [undefined] is not valid');
  expect(post.called).toBe(false);
});

test('failure detail chunks respect Slack limits and retain their order', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage').resolves({ ok: true, ts: 'reply' });
  const many = { ...summary, failures: Array.from({ length: 55 }, (_, i) => ({
    suite: 'suite', test: `test-${i}`, failureReason: 'failed',
  })) };
  const result = await new SlackClient(web).attachDetailsToThread({
    channelIds: ['first'], ts: 'parent', summaryResults: many, maxNumberOfFailures: 55,
  });
  expect(result).toHaveLength(2);
  const requests = post.args.map(args => args[0] as any);
  expect(requests.map(request => request.blocks.length)).toEqual([50, 6]);
  expect(requests.flatMap(request => request.blocks)).toEqual(await generateFailures(many, 55));
  expect(requests.every(request => request.thread_ts === 'parent')).toBe(true);
});

test('layout handles absent metadata and flaky counts and truncates long failures', async () => {
  const minimal = { ...summary, flaky: undefined, failures: [] };
  const blocks = await generateBlocks(minimal, 0);
  expect(blocks).toHaveLength(2);
  expect(generateFallbackText(minimal)).not.toContain('🟡');
  expect(generateFallbackText(summary)).toContain('🟡 0');
  const failures = await generateFailures({ ...summary, failures: [{
    suite: 'suite', test: 'test', failureReason: `${'x'.repeat(649)}\ny`,
  }] }, 1);
  expect((failures[1] as any).text.text).toContain(`>${'x'.repeat(649)}\n>`);
  expect((failures[1] as any).text.text).not.toContain('y');
});

test('bot delivery continues after a channel rejects or throws', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage');
  post.onCall(0).resolves({ ok: false, error: 'channel_not_found' });
  post.onCall(1).rejects(new Error('transport unavailable'));
  post.onCall(2).resolves({ ok: true, ts: '123' });
  const result = await new SlackClient(web).sendMessage({ options: {
    ...options, channelIds: ['first', 'second', 'third'], disableUnfurl: true,
  } });
  expect(result).toEqual<unknown>([
    { channel: 'first', outcome: expect.stringContaining('channel_not_found') },
    { channel: 'second', outcome: expect.stringContaining('transport unavailable') },
    { channel: 'third', outcome: '✅ Message sent to third', ts: '123' },
  ]);
  expect(post.getCall(2).args[0]).toMatchObject({ channel: 'third', unfurl_links: false });
});

for (const asyncLayout of [false, true]) {
  test(`${asyncLayout ? 'async' : 'sync'} custom layout sends remaining blocks in the parent thread`, async () => {
    const web = new WebClient('unit-test');
    const post = sinon.stub(web.chat, 'postMessage').resolves({ ok: true, ts: 'parent' });
    const blocks = [{ type: 'divider' }, { type: 'section', text: { type: 'plain_text', text: 'details' } }];
    const layout = sinon.stub().returns(asyncLayout ? Promise.resolve(blocks) : blocks);
    await new SlackClient(web).sendMessage({ options: {
      ...options, channelIds: ['first'],
      customLayout: asyncLayout ? undefined : layout,
      customLayoutAsync: asyncLayout ? layout : undefined,
      sendCustomBlocksInThreadAfterIndex: 1,
    } });
    expect(layout.calledOnceWithExactly(summary)).toBe(true);
    expect(post.getCall(0).args[0]).toMatchObject({ blocks: blocks.slice(0, 1), unfurl_links: true });
    expect(post.getCall(1).args[0]).toMatchObject({ channel: 'first', blocks: blocks.slice(1), thread_ts: 'parent' });
  });
}

test('async custom layout without splitting stays in the main message', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage').resolves({ ok: true, ts: 'parent' });
  await new SlackClient(web).sendMessage({ options: {
    ...options, channelIds: ['first'], customLayoutAsync: async () => [{ type: 'divider' }],
  } });
  expect(post.callCount).toBe(1);
  expect(post.firstCall.args[0]).toMatchObject({ blocks: [{ type: 'divider' }] });
});

test('thread delivery logs errors while preserving the parent result', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage');
  post.onFirstCall().resolves({ ok: true, ts: 'parent' });
  post.onSecondCall().rejects(new Error('thread unavailable'));
  const log = sinon.stub(console, 'error');
  const result = await new SlackClient(web).sendMessage({ options: {
    ...options, channelIds: ['first'], customLayout: () => [{ type: 'divider' }, { type: 'divider' }],
    sendCustomBlocksInThreadAfterIndex: 1,
  } });
  expect(result).toEqual<unknown>([{ channel: 'first', outcome: '✅ Message sent to first', ts: 'parent' }]);
  expect(log.calledOnceWithExactly('❌ Failed to send threaded message to first: thread unavailable')).toBe(true);
});

test('failure details skip rejected responses and continue after transport errors', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage');
  post.onCall(0).resolves({ ok: false });
  post.onCall(1).rejects(new Error('unavailable'));
  post.onCall(2).resolves({ ok: true, ts: 'reply' });
  sinon.stub(console, 'error');
  const result = await new SlackClient(web).attachDetailsToThread({
    channelIds: ['first', 'second', 'third'], ts: 'parent', summaryResults: summary,
    maxNumberOfFailures: 10, disableUnfurl: false,
  });
  expect(result).toEqual<unknown>([
    { channel: 'second', outcome: '❌ Failed to send failure details to second within thread parent: unavailable' },
    { channel: 'third', outcome: '✅ Message sent to third within thread parent', ts: 'reply' },
  ]);
  expect(post.lastCall.args[0]).toMatchObject({ thread_ts: 'parent', unfurl_links: false });
});

test('failure details make no request when failures are hidden', async () => {
  const web = new WebClient('unit-test');
  const post = sinon.stub(web.chat, 'postMessage');
  expect(await new SlackClient(web).attachDetailsToThread({
    channelIds: ['first'], ts: 'parent', summaryResults: summary, maxNumberOfFailures: 0,
  })).toEqual([]);
  expect(post.called).toBe(false);
});

for (const asyncLayout of [false, true]) {
  test(`webhook uses ${asyncLayout ? 'async' : 'sync'} custom blocks and enables unfurl`, async () => {
    const webhook = new IncomingWebhook('https://example.invalid/webhook');
    const send = sinon.stub(webhook, 'send').resolves({ text: 'ok' });
    const blocks = [{ type: 'divider' }];
    const layout = sinon.stub().returns(asyncLayout ? Promise.resolve(blocks) : blocks);
    const result = await new SlackWebhookClient(webhook).sendMessage({
      customLayout: asyncLayout ? undefined : layout,
      customLayoutAsync: asyncLayout ? layout : undefined,
      maxNumberOfFailures: 10, summaryResults: summary, disableUnfurl: false,
    });
    expect(result).toEqual<unknown>({ outcome: 'ok' });
    expect(layout.calledOnceWithExactly(summary)).toBe(true);
    expect(send.calledOnceWithExactly({ blocks, unfurl_links: true })).toBe(true);
  });
}

test('webhook reports a rejected transport with its error details', async () => {
  const webhook = new IncomingWebhook('https://example.invalid/webhook');
  sinon.stub(webhook, 'send').rejects({ code: 'ECONNRESET' });
  const result = await new SlackWebhookClient(webhook).sendMessage({
    customLayout: undefined, customLayoutAsync: undefined,
    maxNumberOfFailures: 10, summaryResults: summary, disableUnfurl: true,
  });
  expect(result.outcome).toContain('ECONNRESET');
  expect(result.outcome).toMatch(/^error: /);
});
