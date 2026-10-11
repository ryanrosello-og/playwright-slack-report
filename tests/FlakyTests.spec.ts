import { afterEach, beforeEach, expect, test } from 'bun:test';
import sinon from 'ts-sinon';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { TestCase } from '@playwright/test/reporter';
import { SummaryResults } from '../src';
import ResultsParser from '../src/ResultsParser';
import SlackReporter from '../src/SlackReporter';
import SlackClient from '../src/SlackClient';
import SlackWebhookClient from '../src/SlackWebhookClient';
import { generateBlocks, generateFlakyTests } from '../src/LayoutGenerator';
import { ZodCliSchema } from '../src/cli/cli_schema';
import { coveragePreload } from './helpers/coverage';

let directory: string;
beforeEach(async () => { directory = await mkdtemp(path.join(tmpdir(), 'slack-flaky-test-')); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

const attempt = (status: string, retry: number) => ({
  status, retry, duration: 1, startTime: '2026-01-01T00:00:00.000Z', errors: [],
});
const jsonTest = (status: string | undefined, statuses: string[], projectName = 'chromium', expectedStatus = 'passed') => ({
  status, projectName, expectedStatus, results: statuses.map(attempt),
});
const spec = (file: string, tests: any[]) => ({ id: file, file, title: 'same test', tests });
const json = (specs: any[], flaky = 1, unexpected = 0) => ({
  config: { projects: [{ retries: 5 }] }, errors: [],
  suites: [{ title: 'same suite', specs }],
  stats: { expected: 0, unexpected, flaky, skipped: 0 },
});
async function parse(report: any) {
  const file = path.join(directory, 'results.json');
  await writeFile(file, JSON.stringify(report));
  return new ResultsParser().parseFromJsonFile(file);
}
function liveTest(id: string, outcome: string, statuses: string[], projectName = 'chromium'): TestCase {
  return {
    id, title: 'same test', repeatEachIndex: 0,
    parent: { title: 'same suite', project: () => ({ name: projectName }) },
    location: { file: `${id}.spec.ts` }, expectedStatus: 'passed', retries: 5,
    results: statuses.map(attempt), outcome: () => outcome,
  } as unknown as TestCase;
}
const text = (blocks: any[]) => blocks.map(block => block.text?.text ?? '').join('\n');
const empty: SummaryResults = { passed: 0, failed: 0, flaky: 0, skipped: 0, failures: [], tests: [] };
const summary: SummaryResults = {
  ...empty, flaky: 2,
  flakyTests: [
    { suite: 'suite', test: 'login [chromium]', retries: 1 },
    { suite: 'suite', test: 'checkout [firefox]', retries: 2 },
  ],
};

test('JSON preserves one flaky entry per test, project and repetition, with actual retries', async () => {
  const result = await parse(json([
    spec('one.spec.ts', [
      jsonTest('flaky', ['failed', 'passed']),
      jsonTest('flaky', ['timedOut', 'failed', 'passed'], 'firefox'),
      jsonTest('flaky', ['failed', 'passed']),
    ]),
    spec('two.spec.ts', [jsonTest('flaky', ['failed', 'passed'])]),
  ], 4));
  expect(result.flakyTests).toHaveLength(4);
  expect(result.flakyTests?.map(test => test.retries)).toEqual([1, 2, 1, 1]);
  expect(result.flakyTests?.map(test => test.file)).toEqual(['one.spec.ts', 'one.spec.ts', 'one.spec.ts', 'two.spec.ts']);
  expect(result.flakyTests?.[1].test).toBe('same test [firefox]');
  expect(result.failures).toEqual([]);
});

test('JSON trusts final outcomes and excludes clean, failed, skipped and expected-failure tests', async () => {
  const result = await parse(json([spec('one.spec.ts', [
    jsonTest('expected', ['passed']),
    jsonTest('unexpected', ['failed', 'failed']),
    jsonTest('skipped', ['skipped']),
    jsonTest('expected', ['failed'], 'chromium', 'failed'),
    jsonTest('unexpected', ['failed', 'passed']),
    jsonTest('flaky', ['failed', 'passed']),
  ])]));
  expect(result.flakyTests).toHaveLength(1);
  expect(result.flakyTests?.[0].retries).toBe(1);
});

test('JSON without final statuses infers flakiness from expected and unexpected completed attempts', async () => {
  const result = await parse(json([spec('one.spec.ts', [
    jsonTest(undefined, ['failed', 'passed']),
    jsonTest(undefined, ['failed', 'failed']),
    jsonTest(undefined, ['interrupted', 'passed']),
    jsonTest(undefined, ['skipped', 'passed']),
    jsonTest(undefined, []),
    jsonTest(undefined, ['failed'], 'chromium', 'failed'),
  ])]));
  expect(result.flakyTests).toHaveLength(1);
});

test('JSON without spec IDs separates files and keeps fallback names without a project', async () => {
  const first = { file: 'one.spec.ts', title: 'test', tests: [jsonTest('flaky', ['failed', 'passed'], '')] };
  const second = { ...first, file: 'two.spec.ts' };
  const result = await parse(json([first, second], 2));
  expect(result.flakyTests).toHaveLength(2);
  expect(result.flakyTests?.[0].test).toBe('test');
});

test('live parser uses final Playwright outcomes and retains same-named tests independently', async () => {
  const parser = new ResultsParser();
  const flaky = liveTest('one', 'flaky', ['failed', 'passed']);
  parser.addTestResult('same suite', flaky, []);
  // Multiple onTestEnd callbacks must not create duplicate flaky entries.
  parser.addTestResult('same suite', flaky, []);
  const repeated = { ...liveTest('one', 'flaky', ['failed', 'passed']), repeatEachIndex: 1 };
  const result = await parser.getParsedResults([
    flaky, repeated, liveTest('two', 'flaky', ['timedOut', 'failed', 'passed'], 'firefox'),
    liveTest('three', 'unexpected', ['failed', 'failed']),
    liveTest('four', 'expected', ['passed']), liveTest('five', 'skipped', ['skipped']),
  ]);
  expect(result.flaky).toBe(3);
  expect(result.flakyTests).toHaveLength(3);
  expect(result.flakyTests?.map(test => test.retries)).toEqual([1, 1, 2]);
  expect(result.flakyTests?.[2]).toMatchObject({ file: 'two.spec.ts', projectName: 'firefox', test: 'same test [firefox]' });
  expect(result.failures).toEqual([]);
});

test('flaky details have their own cap, pluralize retries and leave the count visible when hidden', async () => {
  expect(text(generateFlakyTests(summary, 1))).toContain('1 retry');
  expect(text(generateFlakyTests(summary, 1))).toContain('1 out of 2 flaky tests shown');
  expect(text(generateFlakyTests(summary, 1))).not.toContain('checkout');
  expect(text(generateFlakyTests(summary, 2))).toContain('2 retries');
  expect(generateFlakyTests(summary, 0)).toEqual([]);
  expect(generateFlakyTests(empty)).toEqual([]);
  expect(text(await generateBlocks(summary, 0, 0))).toContain('🟡 *2*');
  expect(text(await generateBlocks(summary, 0, 0))).not.toContain('login');
});

test('bot puts flaky details in the thread and keeps the flaky count in the parent', async () => {
  const postMessage = sinon.stub().resolves({ ok: true, ts: '123' });
  const client = new SlackClient({ chat: { postMessage } } as any);
  await client.sendMessage({ options: {
    channelIds: ['unit'], summaryResults: summary, showInThread: true,
    customLayout: undefined, customLayoutAsync: undefined, maxNumberOfFailures: 0,
  } });
  await client.attachDetailsToThread({ channelIds: ['unit'], ts: '123', summaryResults: summary,
    maxNumberOfFailures: 0, maxNumberOfFlakyTests: 1 });
  expect(text(postMessage.firstCall.args[0].blocks)).toContain('🟡 *2*');
  expect(text(postMessage.firstCall.args[0].blocks)).not.toContain('login');
  expect(text(postMessage.secondCall.args[0].blocks)).toContain('login');
  expect(text(postMessage.secondCall.args[0].blocks)).not.toContain('checkout');
  expect(postMessage.secondCall.args[0].thread_ts).toBe('123');
});

test('bot splits large flaky threads within the existing 50-block limit', async () => {
  const postMessage = sinon.stub().resolves({ ok: true, ts: '123' });
  await new SlackClient({ chat: { postMessage } } as any).attachDetailsToThread({
    channelIds: ['unit'], ts: '123', maxNumberOfFailures: 0, maxNumberOfFlakyTests: 55,
    summaryResults: { ...summary, flakyTests: Array.from({ length: 55 }, (_, index) => ({
      suite: 'suite', test: `flaky ${index}`, retries: 1,
    })) },
  });
  expect(postMessage.callCount).toBe(2);
  for (const call of postMessage.getCalls()) {
    expect(call.args[0].blocks.length).toBeLessThanOrEqual(50);
    expect(call.args[0].thread_ts).toBe('123');
  }
});

for (const transport of ['bot', 'webhook'] as const) {
  for (const scenario of ['clean', 'failed', 'flaky', 'mixed', 'on-failure'] as const) {
    test(`reporter ${transport}: ${scenario} respects notification mode and channel routing`, async () => {
      const send = transport === 'bot'
        ? sinon.stub(SlackClient.prototype, 'sendMessage').resolves([{ channel: 'unit', outcome: 'ok', ts: '123' }])
        : sinon.stub(SlackWebhookClient.prototype, 'sendMessage').resolves({ outcome: 'ok' });
      const attach = sinon.stub(SlackClient.prototype, 'attachDetailsToThread').resolves([]);
      const options = {
        sendResults: scenario === 'on-failure' ? 'on-failure' : 'on-flaky',
        maxNumberOfFlakyTestsToShow: 1, showInThread: transport === 'bot',
        onSuccessChannels: ['success'], onFailureChannels: ['failure'],
        ...(transport === 'bot' ? { slackOAuthToken: 'unit-token' } : { slackWebHookUrl: 'https://example.invalid/webhook' }),
      };
      const tests = scenario === 'clean' ? [liveTest('one', 'expected', ['passed'])]
        : scenario === 'failed' ? [liveTest('one', 'unexpected', ['failed'])]
        : [liveTest('one', 'flaky', ['failed', 'passed']),
          ...(scenario === 'mixed' ? [liveTest('two', 'unexpected', ['failed'])] : [])];
      const reporter = new SlackReporter(options);
      reporter.onBegin({ projects: [], reporter: [['SlackReporter', options]] } as any,
        { allTests: () => tests } as any);
      await reporter.onEnd();
      const shouldSend = scenario === 'flaky' || scenario === 'mixed';
      expect(send.called).toBe(shouldSend);
      expect(attach.called).toBe(shouldSend && transport === 'bot');
      if (shouldSend) {
        const request = send.firstCall.args[0];
        const payload = 'options' in request ? request.options : request;
        expect(payload.maxNumberOfFlakyTests).toBe(1);
        expect(payload.summaryResults.flakyTests).toHaveLength(1);
        if ('channelIds' in payload) expect(payload.channelIds).toEqual([scenario === 'mixed' ? 'failure' : 'success']);
      }
    });
  }
}

test('reporter and CLI validate flaky detail limits and preserve zero', () => {
  for (const limit of [-1, 1.5, '2', NaN, Infinity]) {
    expect(new SlackReporter({ slackOAuthToken: 'unit-token', channels: ['unit'], sendResults: 'on-flaky',
      maxNumberOfFlakyTestsToShow: limit }).preChecks().okToProceed).toBe(false);
    expect(ZodCliSchema.safeParse({ sendResults: 'on-flaky', slackLogLevel: 'error', maxNumberOfFlakyTests: limit }).success).toBe(false);
  }
  expect(new SlackReporter({ slackOAuthToken: 'unit-token', channels: ['unit'], sendResults: 'on-flaky',
    maxNumberOfFlakyTestsToShow: 0 }).preChecks().okToProceed).toBe(true);
  expect(ZodCliSchema.parse({ sendResults: 'on-flaky', slackLogLevel: 'error' }).maxNumberOfFlakyTests).toBe(10);
  expect(ZodCliSchema.parse({ sendResults: 'on-flaky', slackLogLevel: 'error', maxNumberOfFlakyTests: 0 }).maxNumberOfFlakyTests).toBe(0);
  expect(new SlackReporter({ slackOAuthToken: 'unit-token', sendResults: 'on-flaky',
    onFailureChannels: ['failure'] }).preChecks().okToProceed).toBe(false);
  expect(new SlackReporter({ slackOAuthToken: 'unit-token', sendResults: 'on-flaky',
    onSuccessChannels: ['success'] }).preChecks().okToProceed).toBe(false);
});

const execute = promisify(execFile);
for (const transport of ['bot', 'webhook'] as const) {
  for (const scenario of ['clean', 'failed', 'flaky', 'mixed', 'hidden', 'on-failure'] as const) {
    test(`CLI ${transport}: ${scenario} uses real config, parsing and mocked delivery`, async () => {
      const flaky = !['clean', 'failed'].includes(scenario);
      const failed = ['failed', 'mixed'].includes(scenario);
      const specs = [spec('one.spec.ts', [jsonTest(flaky ? 'flaky' : failed ? 'unexpected' : 'expected',
        flaky ? ['failed', 'passed'] : [failed ? 'failed' : 'passed'])])];
      if (failed && flaky) specs.push(spec('two.spec.ts', [jsonTest('unexpected', ['failed'])]));
      const results = path.join(directory, 'results.json');
      const config = path.join(directory, 'config.json');
      const capture = path.join(directory, 'capture.jsonl');
      await writeFile(results, JSON.stringify(json(specs, flaky ? 1 : 0, failed ? 1 : 0)));
      await writeFile(capture, '');
      await writeFile(config, JSON.stringify({
        sendResults: scenario === 'on-failure' ? 'on-failure' : 'on-flaky', slackLogLevel: 'error',
        maxNumberOfFlakyTests: scenario === 'hidden' ? 0 : 1, showInThread: transport === 'bot',
        ...(transport === 'bot' ? { sendUsingBot: { channels: ['unit'] } }
          : { sendUsingWebhook: { webhookUrl: 'https://example.invalid/webhook' } }),
      }));
      const env: NodeJS.ProcessEnv = { ...process.env, HARNESS_CAPTURE: capture };
      delete env.SLACK_BOT_USER_OAUTH_TOKEN;
      if (transport === 'bot') env.SLACK_BOT_USER_OAUTH_TOKEN = 'unit-token';
      await execute(process.execPath, [...coveragePreload(), '--preload', path.resolve('tests/helpers/capture-slack.ts'),
        path.resolve('cli.ts'), '-c', config, '-j', results], { env, timeout: 15000 });
      const captured = (await readFile(capture, 'utf8')).trim();
      if (!flaky || scenario === 'on-failure') {
        expect(captured).toBe('');
        return;
      }
      const messages = captured.split('\n').map(line => JSON.parse(line));
      expect(messages).toHaveLength(transport === 'bot' && scenario !== 'hidden' ? 2 : 1);
      const details = text(messages.at(-1).payload.blocks);
      expect(text(messages[0].payload.blocks)).toContain('🟡 *1*');
      if (scenario === 'hidden') expect(details).not.toContain('Flaky tests');
      else {
        expect(details).toContain('same test [chromium]');
        expect(details).toContain('1 retry');
        if (transport === 'bot') expect(messages[1].payload.thread_ts).toBe(messages[0].ts);
      }
    });
  }
}
