import { coveragePreload } from './helpers/coverage';
import { beforeEach, afterEach, expect, test } from 'bun:test';
import { FullConfig, FullResult, Suite } from '@playwright/test/reporter';
import sinon from 'ts-sinon';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { RunStatus, SummaryResults } from '../src';
import ResultsParser from '../src/ResultsParser';
import SlackReporter from '../src/SlackReporter';
import SlackClient from '../src/SlackClient';
import SlackWebhookClient from '../src/SlackWebhookClient';
import {
  generateBlocks,
  generateFailures,
  generateFallbackText,
} from '../src/LayoutGenerator';
import { getRunStatus, hasRunFailure } from '../src/RunResults';

let testDirectory: string;
beforeEach(async () => { testDirectory = await mkdtemp(path.join(tmpdir(), 'slack-run-test-')); });
afterEach(async () => { await rm(testDirectory, { recursive: true, force: true }); });

const empty: SummaryResults = {
  passed: 0,
  failed: 0,
  flaky: 0,
  skipped: 0,
  tests: [],
  failures: [],
};
const fullResult = (status: RunStatus): FullResult => ({
  status,
  startTime: new Date(),
  duration: 100,
});
const config = (options: any): FullConfig =>
  ({
    projects: [],
    reporter: [['SlackReporter', options]],
  }) as unknown as FullConfig;
const suite = { allTests: () => [] } as unknown as Suite;
const json = (overrides = {}) => ({
  config: { projects: [] },
  suites: [],
  errors: [],
  stats: { expected: 0, unexpected: 0, flaky: 0, skipped: 0 },
  ...overrides,
});
const blockText = (blocks: any[]) =>
  blocks.map((block) => block.text?.text || '').join('\n');

// Repeated describe/test titles in separate files are valid Playwright tests.
const jsonWithNamedTests = (statuses: string[]) =>
  json({
    suites: statuses.map((status, index) => ({
      title: `${index}.spec.ts`,
      suites: [
        {
          title: 'shared describe title',
          specs: [
            {
              title: 'shared test title',
              file: `${index}.spec.ts`,
              tests: [
                {
                  projectName: 'chromium',
                  results: [
                    {
                      status,
                      retry: 0,
                      startTime: new Date().toISOString(),
                      duration: 10,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })),
    stats: {
      expected: statuses.filter((status) => status === 'passed').length,
      unexpected: statuses.filter((status) => status === 'failed').length,
      skipped: statuses.filter((status) => status === 'interrupted').length,
      flaky: 0,
    },
  });

afterEach(() => sinon.restore());

for (const outcome of ['expected', 'flaky', 'skipped'] as const) {
  test(`${outcome} tests alone do not trigger on-failure notifications`, async () => {
    const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([]);
    const options = {
      sendResults: 'on-failure',
      slackOAuthToken: 'unit-token',
      channels: ['unit'],
    };
    const reporter = new SlackReporter(options);
    reporter.onBegin(config(options), {
      allTests: () => [{ outcome: () => outcome }],
    } as unknown as Suite);
    await reporter.onEnd(fullResult('passed'));
    expect(send.called).toBe(false);
  });
}

test('successful nonempty runs still use success channels in always mode', async () => {
  const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([]);
  const options = {
    sendResults: 'always',
    slackOAuthToken: 'unit-token',
    onFailureChannels: ['failures'],
    onSuccessChannels: ['success'],
  };
  const reporter = new SlackReporter(options);
  reporter.onBegin(config(options), {
    allTests: () => [{ outcome: () => 'expected' }],
  } as unknown as Suite);
  await reporter.onEnd(fullResult('passed'));
  expect(send.firstCall.args[0].options.channelIds).toEqual(['success']);
  expect(send.firstCall.args[0].options.summaryResults).toMatchObject({
    passed: 1,
    failed: 0,
    runStatus: 'passed',
  });
});

for (const transport of ['bot', 'webhook'] as const) {
  for (const status of ['failed', 'timedout', 'interrupted'] as const) {
    test(`${transport}: ${status} sends with zero failed tests in on-failure mode`, async () => {
      const send =
        transport === 'bot'
          ? sinon
              .stub(SlackClient.prototype, 'sendMessage')
              .resolves([{ channel: 'failures', outcome: 'ok', ts: '123' }])
          : sinon
              .stub(SlackWebhookClient.prototype, 'sendMessage')
              .resolves({ outcome: 'ok' });
      const options = {
        sendResults: 'on-failure',
        onFailureChannels: ['failures'],
        onSuccessChannels: ['success'],
        ...(transport === 'bot'
          ? { slackOAuthToken: 'unit-token' }
          : { slackWebHookUrl: 'https://example.invalid/webhook' }),
      };
      const reporter = new SlackReporter(options);
      reporter.onBegin(config(options), suite);
      await reporter.onEnd(fullResult(status));
      expect(send.calledOnce).toBe(true);
      const args = send.firstCall.args[0] as any;
      const summary =
        transport === 'bot' ? args.options.summaryResults : args.summaryResults;
      expect(summary).toMatchObject({ ...empty, runStatus: status });
      if (transport === 'bot')
        expect(args.options.channelIds).toEqual(['failures']);
    });
  }
}

for (const timing of [
  'before-begin',
  'after-begin',
  'without-begin',
] as const) {
  test(`global errors ${timing} are retained and sent to failure channel`, async () => {
    const send = sinon
      .stub(SlackClient.prototype, 'sendMessage')
      .resolves([{ channel: 'failures', outcome: 'ok', ts: '123' }]);
    const thread = sinon
      .stub(SlackClient.prototype, 'attachDetailsToThread')
      .resolves([]);
    const options = {
      sendResults: 'on-failure',
      showInThread: true,
      slackOAuthToken: 'unit-token',
      onFailureChannels: ['failures'],
    };
    const reporter = new SlackReporter(options);
    if (timing === 'after-begin') reporter.onBegin(config(options), suite);
    reporter.onError({ message: '\u001b[31mSetup failed\u001b[0m' });
    reporter.onError({ value: 'Worker crashed' });
    if (timing === 'before-begin') reporter.onBegin(config(options), suite);
    // Even a passed FullResult must not conceal global errors.
    await reporter.onEnd(fullResult('passed'));
    expect(send.firstCall.args[0].options.summaryResults).toMatchObject({
      ...empty,
      runErrors: ['Setup failed', 'Worker crashed'],
    });
    expect(send.firstCall.args[0].options.channelIds).toEqual(['failures']);
    expect(thread.calledOnce).toBe(true);
    expect(thread.firstCall.args[0].ts).toBe('123');
  });
}

for (const sendResults of ['off', 'on-failure', 'always']) {
  test(`${sendResults}: clean empty runs remain silent; off also suppresses global errors`, async () => {
    const send = sinon.stub(SlackClient.prototype, 'sendMessage').resolves([]);
    const options = {
      sendResults,
      slackOAuthToken: 'unit-token',
      channels: ['unit'],
    };
    const reporter = new SlackReporter(options);
    reporter.onBegin(config(options), suite);
    if (sendResults === 'off') reporter.onError({ message: 'Setup failed' });
    await reporter.onEnd(
      fullResult(sendResults === 'off' ? 'failed' : 'passed'),
    );
    expect(send.called).toBe(false);
  });
}

test('JSON parser preserves global errors, strips ANSI and keeps test failure counts separate', async () => {
  const file = path.join(testDirectory, 'results.json');
  await writeFile(
    file,
    JSON.stringify(
      json({
        errors: [
          {
            message: 'Fallback',
            stack: '\u001b[31mError: Setup failed\u001b[0m\n  at setup.js:1',
            snippet: 'throw new Error()',
          },
          { value: 'Thrown value' },
          {},
        ],
      }),
    ),
  );
  const summary = await new ResultsParser().parseFromJsonFile(file);
  expect(summary).toMatchObject({
    ...empty,
    runStatus: 'failed',
    runErrors: [
      'throw new Error()\nError: Setup failed\n  at setup.js:1',
      'Thrown value',
      'Unknown run-level error',
    ],
  });
});

test('JSON parser infers interruptions from individual results', async () => {
  const file = path.join(testDirectory, 'results.json');
  await writeFile(
    file,
    JSON.stringify(
      json({
        suites: [
          {
            title: 'suite',
            specs: [
              {
                title: 'test',
                tests: [
                  {
                    projectName: 'chromium',
                    results: [
                      {
                        status: 'interrupted',
                        retry: 0,
                        startTime: new Date().toISOString(),
                        duration: 10,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    ),
  );
  const summary = await new ResultsParser().parseFromJsonFile(file);
  expect(summary.runStatus).toBe('interrupted');
  expect(summary.failed).toBe(0);
  expect(summary.failures).toEqual([]);
});

test('legacy JSON without an errors field remains supported', async () => {
  const data = json();
  delete data.errors;
  const file = path.join(testDirectory, 'results.json');
  await writeFile(file, JSON.stringify(data));
  expect(await new ResultsParser().parseFromJsonFile(file)).toMatchObject({
    ...empty,
    runStatus: 'passed',
  });
});

test('JSON interruption detection survives matching test titles across files', async () => {
  const file = path.join(testDirectory, 'results.json');
  await writeFile(
    file,
    JSON.stringify(jsonWithNamedTests(['interrupted', 'passed'])),
  );
  const summary = await new ResultsParser().parseFromJsonFile(file);
  expect(summary.runStatus).toBe('interrupted');
  expect(hasRunFailure(summary)).toBe(true);
});

test('JSON failures take precedence over tests interrupted by fail-fast', async () => {
  const file = path.join(testDirectory, 'results.json');
  await writeFile(
    file,
    JSON.stringify(jsonWithNamedTests(['failed', 'interrupted'])),
  );
  const summary = await new ResultsParser().parseFromJsonFile(file);
  expect(summary.failed).toBe(1);
  expect(summary.runStatus).toBe('failed');
});

for (const status of ['failed', 'timedout', 'interrupted'] as const) {
  test(`layout and fallback expose ${status} even when details are disabled`, async () => {
    const summary = {
      ...empty,
      runStatus: status,
      runErrors: ['Setup failed'],
    };
    const label = status === 'timedout' ? 'timed out' : status;
    expect(blockText(await generateBlocks(summary, 0))).toContain(
      `Run status: ${label}`,
    );
    expect(blockText(await generateBlocks(summary, 0))).not.toContain(
      'Setup failed',
    );
    expect(generateFallbackText(summary)).toContain(`Run status: ${label}`);
    expect(hasRunFailure(summary)).toBe(true);
  });
}

test('run errors are prioritized, capped and truncated alongside test failures', async () => {
  const summary = {
    ...empty,
    runErrors: ['x'.repeat(4000), 'Second global error'],
    failures: [{ suite: 'suite', test: 'test', failureReason: 'Assertion' }],
  };
  const blocks = await generateFailures(summary, 1);
  const text = blockText(blocks);
  expect(text).toContain('Run-level error');
  expect(text).toContain('1 out of 3 failures shown');
  expect(text).not.toContain('Second global error');
  expect(text).not.toContain('Assertion');
  expect((blocks[1] as any).text.text.length).toBeLessThan(3000);
  expect(blockText(await generateBlocks(summary, 0))).toContain(
    'Run status: failed',
  );
});

test('bot keeps run status in parent and puts global errors in its thread', async () => {
  const postMessage = sinon.stub().resolves({ ok: true, ts: '123' });
  const client = new SlackClient({ chat: { postMessage } } as any);
  const summary = {
    ...empty,
    runStatus: 'failed' as const,
    runErrors: ['Setup failed'],
  };
  await client.sendMessage({
    options: {
      channelIds: ['unit'],
      summaryResults: summary,
      showInThread: true,
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: 10,
    },
  });
  await client.attachDetailsToThread({
    channelIds: ['unit'],
    ts: '123',
    summaryResults: summary,
    maxNumberOfFailures: 10,
  });
  expect(blockText(postMessage.firstCall.args[0].blocks)).toContain(
    'Run status: failed',
  );
  expect(blockText(postMessage.firstCall.args[0].blocks)).not.toContain(
    'Setup failed',
  );
  expect(blockText(postMessage.secondCall.args[0].blocks)).toContain(
    'Setup failed',
  );
  expect(postMessage.secondCall.args[0].thread_ts).toBe('123');
});

test('passed status cannot conceal global errors in a threaded parent', async () => {
  const postMessage = sinon.stub().resolves({ ok: true, ts: '123' });
  const summary = {
    ...empty,
    runStatus: 'passed' as const,
    runErrors: ['Setup failed'],
  };
  expect(getRunStatus(summary)).toBe('failed');
  expect(hasRunFailure(summary)).toBe(true);
  await new SlackClient({ chat: { postMessage } } as any).sendMessage({
    options: {
      channelIds: ['unit'],
      summaryResults: summary,
      showInThread: true,
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: 10,
    },
  });
  expect(blockText(postMessage.firstCall.args[0].blocks)).toContain(
    'Run status: failed',
  );
});

test('webhook includes global errors inline and run status in fallback text', async () => {
  const send = sinon.stub().resolves({ text: 'ok' });
  await new SlackWebhookClient({ send } as any).sendMessage({
    summaryResults: {
      ...empty,
      runStatus: 'failed',
      runErrors: ['Setup failed'],
    },
    customLayout: undefined,
    customLayoutAsync: undefined,
    maxNumberOfFailures: 10,
    disableUnfurl: true,
  });
  expect(blockText(send.firstCall.args[0].blocks)).toContain('Setup failed');
  expect(send.firstCall.args[0].text).toContain('Run status: failed');
});

const execute = promisify(execFile);
for (const transport of ['bot', 'webhook'] as const) {
  for (const scenario of [
    'global-error',
    'timedout',
    'interrupted',
    'interrupted-json',
    'clean',
    'invalid-status',
  ] as const) {
    test(`CLI ${transport}: ${scenario} uses real parsing and notification decisions`, async () => {
      const directory = await mkdtemp(path.join(tmpdir(), 'slack-run-unit-'));
      try {
        const results = path.join(directory, 'results.json');
        const configFile = path.join(directory, 'config.json');
        const capture = path.join(directory, 'capture.jsonl');
        await writeFile(
          results,
          JSON.stringify(
            json(
              scenario === 'global-error'
                ? { errors: [{ message: 'Setup failed' }] }
                : scenario === 'interrupted-json'
                  ? jsonWithNamedTests(['interrupted', 'passed'])
                  : {},
            ),
          ),
        );
        await writeFile(
          configFile,
          JSON.stringify({
            sendResults: 'on-failure',
            slackLogLevel: 'error',
            showInThread: transport === 'bot',
            ...(transport === 'bot'
              ? { sendUsingBot: { channels: ['unit'] } }
              : {
                  sendUsingWebhook: {
                    webhookUrl: 'https://example.invalid/webhook',
                  },
                }),
          }),
        );
        await writeFile(capture, '');
        const env: NodeJS.ProcessEnv = {
          ...process.env,
          HARNESS_CAPTURE: capture,
        };
        delete env.SLACK_BOT_USER_OAUTH_TOKEN;
        if (transport === 'bot') env.SLACK_BOT_USER_OAUTH_TOKEN = 'unit-token';
        const args = [
          ...coveragePreload(),
          '--preload',
          path.resolve('tests/helpers/capture-slack.ts'),
          path.resolve('cli.ts'),
          '-c',
          configFile,
          '-j',
          results,
        ];
        if (
          scenario !== 'global-error' &&
          scenario !== 'clean' &&
          scenario !== 'interrupted-json'
        )
          args.push(
            '--run-status',
            scenario === 'invalid-status' ? 'unknown' : scenario,
          );
        if (scenario === 'invalid-status') {
          await expect(
            execute(process.execPath, args, { env, timeout: 15000 }),
          ).rejects.toMatchObject({ code: 1 });
          expect(await readFile(capture, 'utf8')).toBe('');
          return;
        }
        await execute(process.execPath, args, { env, timeout: 15000 });
        const captured = (await readFile(capture, 'utf8')).trim();
        if (scenario === 'clean') {
          expect(captured).toBe('');
          return;
        }
        expect(captured).not.toBe('');
        const messages = captured.split('\n').map((line) => JSON.parse(line));
        expect(messages).toHaveLength(
          scenario === 'global-error' && transport === 'bot' ? 2 : 1,
        );
        const status =
          scenario === 'global-error'
            ? 'failed'
            : scenario === 'interrupted-json'
              ? 'interrupted'
              : scenario === 'timedout'
                ? 'timed out'
                : scenario;
        expect(blockText(messages[0].payload.blocks)).toContain(
          `Run status: ${status}`,
        );
        if (scenario === 'global-error')
          expect(blockText(messages.at(-1).payload.blocks)).toContain(
            'Setup failed',
          );
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  }
}
