import { afterEach, beforeEach, expect, test } from 'bun:test';
import sinon from 'ts-sinon';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import {
  ArtifactLinksSchema,
  resolveArtifactLinks,
} from '../src/ArtifactLinks';
import { SummaryResults } from '../src';
import ResultsParser from '../src/ResultsParser';
import SlackReporter from '../src/SlackReporter';
import SlackClient from '../src/SlackClient';
import SlackWebhookClient from '../src/SlackWebhookClient';
import { generateFailures } from '../src/LayoutGenerator';
import { ZodCliSchema } from '../src/cli/cli_schema';
import { coveragePreload } from './helpers/coverage';

let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'slack-artifacts-'));
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

const attachment = (file?: string, name = 'Screenshot') => ({
  name,
  path: file,
  contentType: 'image/png',
});
const options = {
  baseUrl: 'https://ci.example/runs/42',
  reportUrl: 'https://ci.example/runs/42/report/index.html',
};
const empty: SummaryResults = {
  passed: 0,
  failed: 1,
  flaky: 0,
  skipped: 0,
  failures: [],
  tests: [],
};
const text = (blocks: any[]) =>
  blocks.map((block) => block.text?.text ?? '').join('\n');
const attempt = (retry: number, file: string, status = 'failed') => ({
  retry,
  status,
  startTime: '2026-01-01T00:00:00Z',
  duration: 1,
  errors: [{ message: 'failed' }],
  attachments: [attachment(file)],
});
const liveTest = (id: string, file: string, project = 'chromium') => ({
  id,
  title: 'same test',
  repeatEachIndex: 0,
  _projectId: project,
  location: { file: `${id}.spec.ts` },
  parent: { title: 'suite' },
  retries: 1,
  results: [attempt(0, 'old.png'), attempt(1, file)],
  outcome: () => 'unexpected',
});
const report = (file: string) => ({
  config: { projects: [{ retries: 1 }] },
  errors: [],
  stats: { expected: 0, unexpected: 1, flaky: 0, skipped: 0 },
  suites: [
    {
      title: 'suite',
      specs: [
        {
          id: 'test',
          title: 'test',
          file: 'test.spec.ts',
          tests: [
            {
              projectName: 'chromium',
              expectedStatus: 'passed',
              status: 'unexpected',
              results: [
                attempt(0, path.join(directory, 'old.png')),
                attempt(1, file),
              ],
            },
          ],
        },
      ],
    },
  ],
});

test('maps uploaded directory paths, encodes file names, skips missing bodies and deduplicates', () => {
  const file = path.join(directory, 'test #1', 'a & b%.png');
  const links = resolveArtifactLinks(
    [attachment(file), attachment(file), attachment()],
    { ...options, pathPrefix: directory },
  );
  expect(links).toEqual([
    { name: 'HTML report', url: options.reportUrl },
    {
      name: 'Screenshot',
      contentType: 'image/png',
      url: `${options.baseUrl}/test%20%231/a%20%26%20b%25.png`,
    },
  ]);
  expect(resolveArtifactLinks([attachment(file)])).toEqual([]);
  expect(
    resolveArtifactLinks(undefined, { reportUrl: options.reportUrl }),
  ).toHaveLength(1);
  expect(
    resolveArtifactLinks([attachment('test-results/screenshot.png')], {
      baseUrl: options.baseUrl,
    }),
  ).toEqual([
    {
      name: 'Screenshot',
      contentType: 'image/png',
      url: `${options.baseUrl}/test-results/screenshot.png`,
    },
  ]);
});

test('handles Windows and POSIX CI paths independently of the reporting host', () => {
  expect(
    resolveArtifactLinks(
      [attachment(path.resolve('test-results', 'screen.png'))],
      {
        baseUrl: options.baseUrl,
        pathPrefix: 'test-results',
      },
    )[0].url,
  ).toBe(`${options.baseUrl}/screen.png`);
  expect(
    resolveArtifactLinks(
      [attachment('C:\\ci\\output\\test\\trace.zip', 'Trace')],
      {
        baseUrl: `${options.baseUrl}/`,
        pathPrefix: 'C:\\ci\\output',
      },
    )[0].url,
  ).toBe(`${options.baseUrl}/test/trace.zip`);
  expect(
    resolveArtifactLinks([attachment('/ci/output/test/screen.png')], {
      baseUrl: options.baseUrl,
      pathPrefix: '/ci/output',
    })[0].url,
  ).toBe(`${options.baseUrl}/test/screen.png`);
});

test('rejects traversal, sibling directories, foreign drives and paths that are URLs', () => {
  for (const file of [
    '/ci/output/../secret',
    '/ci/output-sibling/file',
    '/elsewhere/file',
    '/ci/output',
    'C:\\ci\\output\\file',
    'https://example.com/file',
  ]) {
    expect(
      resolveArtifactLinks([attachment(file)], {
        baseUrl: options.baseUrl,
        pathPrefix: '/ci/output',
      }),
    ).toEqual([]);
  }
  expect(
    resolveArtifactLinks([attachment('D:\\output\\file')], {
      baseUrl: options.baseUrl,
      pathPrefix: 'C:\\output',
    }),
  ).toEqual([]);
});

test('reporter and CLI reject invalid mapping configuration consistently', () => {
  for (const config of [
    null,
    'invalid',
    { pathPrefix: '/ci' },
    { pathPrefix: '', baseUrl: options.baseUrl },
    { baseUrl: 'invalid' },
    { baseUrl: 'file:///ci' },
    { reportUrl: 'javascript:alert(1)' },
    { baseUrl: 'https://user:password@example.com' },
    { baseUrl: 'https://example.com?q=1' },
    { baseUrl: 'https://example.com/#hash' },
    { reportUrl: 'https://example.com/<x|bad>' },
    { reportUrl: 'https://example.com/a b' },
  ]) {
    expect(ArtifactLinksSchema.safeParse(config).success).toBe(false);
    expect(
      ZodCliSchema.safeParse({
        sendResults: 'always',
        slackLogLevel: 'error',
        artifactLinks: config,
      }).success,
    ).toBe(false);
    expect(
      new SlackReporter({
        slackOAuthToken: 'unit-token',
        channels: ['unit'],
        artifactLinks: config,
      }).preChecks().okToProceed,
    ).toBe(false);
  }
  expect(
    ArtifactLinksSchema.safeParse({
      reportUrl: 'https://ci.example/report?signature=abc&key=1#test',
    }).success,
  ).toBe(true);
  expect(
    ZodCliSchema.parse({
      sendResults: 'always',
      slackLogLevel: 'error',
      artifactLinks: options,
    }).artifactLinks,
  ).toEqual(options);
});

test('live failures keep final-attempt artifacts separate across tests, projects and repetitions', async () => {
  const parser = new ResultsParser({ ...options, pathPrefix: directory });
  const tests = [
    liveTest('one', path.join(directory, 'one.png')),
    liveTest('two', path.join(directory, 'two.png')),
    {
      ...liveTest('one', path.join(directory, 'repeat.png')),
      repeatEachIndex: 1,
    },
    liveTest('firefox-test', path.join(directory, 'firefox.png'), 'firefox'),
  ];
  for (const testCase of tests) {
    parser.addTestResult(
      'suite',
      { ...testCase, results: testCase.results.slice(0, 1) },
      [],
    );
    parser.addTestResult('suite', testCase, []);
  }
  const summary = await parser.getParsedResults(tests as any);
  expect(summary.failures).toHaveLength(4);
  expect(summary.failures.map((failure) => failure.artifacts?.[1].url)).toEqual(
    ['one', 'two', 'repeat', 'firefox'].map(
      (name) => `${options.baseUrl}/${name}.png`,
    ),
  );
  expect(summary.tests[0].attachments?.[0].path).toBe(
    path.join(directory, 'one.png'),
  );
  parser.setArtifactLinks(undefined);
  expect((await parser.getFailures())[0]).not.toHaveProperty('artifacts');
});

test('JSON uses final-attempt attachments and keeps same-named suites independent', async () => {
  const json = report(path.join(directory, 'final.png'));
  json.suites.push({
    ...json.suites[0],
    specs: [
      {
        ...json.suites[0].specs[0],
        id: 'second',
        tests: [
          {
            ...json.suites[0].specs[0].tests[0],
            results: [attempt(1, path.join(directory, 'second.png'))],
          },
        ],
      },
    ],
  });
  const file = path.join(directory, 'report.json');
  await writeFile(file, JSON.stringify(json));
  const summary = await new ResultsParser({
    ...options,
    pathPrefix: directory,
  }).parseFromJsonFile(file);
  expect(summary.failures.map((failure) => failure.artifacts?.[1].url)).toEqual(
    [`${options.baseUrl}/final.png`, `${options.baseUrl}/second.png`],
  );
  expect(JSON.stringify(summary.failures)).not.toContain('old.png');
});

test('passing retries do not display artifact links as failures', async () => {
  const parser = new ResultsParser(options);
  const testCase = liveTest('one', 'final.png');
  testCase.results[1].status = 'passed';
  parser.addTestResult('suite', testCase, []);
  expect(await parser.getFailures()).toEqual([]);
});

test('default failures escape labels and signed URLs and respect hidden detail limits', async () => {
  const summary = {
    ...empty,
    failures: [
      {
        suite: 'suite',
        test: 'test',
        failureReason: 'reason',
        artifacts: [
          {
            name: 'Trace <x> & a|b\n<!channel>',
            url: 'https://ci.example/trace.zip?key=1&sig=2',
          },
          { name: 'unsafe', url: 'javascript:alert(1)' },
        ],
      },
    ],
  };
  const output = text(await generateFailures(summary, 1));
  expect(output).toContain(
    '<https://ci.example/trace.zip?key=1&amp;sig=2|Trace &lt;x&gt; &amp; a b &lt;!channel&gt;>',
  );
  expect(output).not.toContain('javascript');
  expect(await generateFailures(summary, 0)).toEqual([]);
});

test('many and oversized artifact links stay within one section and never split a URL', async () => {
  const blocks: any[] = await generateFailures(
    {
      ...empty,
      failures: [
        {
          suite: 'suite',
          test: 'test',
          failureReason: 'reason',
          artifacts: [
            { name: 'too long', url: `https://ci.example/${'x'.repeat(4000)}` },
            ...Array.from({ length: 60 }, (_, i) => ({
              name: `image ${i}`,
              url: `https://ci.example/${i}/${'x'.repeat(100)}`,
            })),
            { name: '', url: 'https://ci.example/short' },
          ],
        },
      ],
    },
    1,
  );
  expect(blocks).toHaveLength(2);
  expect(blocks[1].text.text.length).toBeLessThanOrEqual(3000);
  expect(blocks[1].text.text).toContain('Additional artifact links omitted.');
  expect(blocks[1].text.text).not.toContain('too long');
  for (const line of blocks[1].text.text
    .split('\n')
    .filter((line) => line.startsWith('<'))) {
    expect(line).toMatch(/^<https:\/\/ci\.example\/[^<>]+\|[^<>]+>$/);
  }
});

for (const transport of ['bot', 'webhook'] as const) {
  test(`reporter ${transport} resolves artifacts before default and custom layouts`, async () => {
    const send =
      transport === 'bot'
        ? sinon.stub(SlackClient.prototype, 'sendMessage').resolves([])
        : sinon
            .stub(SlackWebhookClient.prototype, 'sendMessage')
            .resolves({ outcome: 'ok' });
    const testCase = liveTest('one', path.join(directory, 'final.png'));
    const reporter = new SlackReporter({
      channels: ['unit'],
      artifactLinks: { ...options, pathPrefix: directory },
      ...(transport === 'bot'
        ? { slackOAuthToken: 'unit-token' }
        : { slackWebHookUrl: 'https://example.invalid/webhook' }),
    });
    reporter.onBegin(
      { projects: [], reporter: [] } as any,
      { allTests: () => [testCase] } as any,
    );
    reporter.onTestEnd(testCase as any, {} as any);
    await reporter.onEnd();
    const request = send.firstCall.args[0];
    const payload = 'options' in request ? request.options : request;
    expect(payload.summaryResults.failures[0].artifacts[1].url).toBe(
      `${options.baseUrl}/final.png`,
    );
  });

  test(`CLI ${transport} sends hosted links in ${transport === 'bot' ? 'threads' : 'inline failures'}`, async () => {
    const results = path.join(directory, 'results.json');
    const config = path.join(directory, 'config.json');
    const capture = path.join(directory, 'capture.jsonl');
    await writeFile(
      results,
      JSON.stringify(report(path.join(directory, 'final.png'))),
    );
    await writeFile(
      config,
      JSON.stringify({
        sendResults: 'always',
        slackLogLevel: 'error',
        artifactLinks: { ...options, pathPrefix: directory },
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
    const env: NodeJS.ProcessEnv = { ...process.env, HARNESS_CAPTURE: capture };
    delete env.SLACK_BOT_USER_OAUTH_TOKEN;
    if (transport === 'bot') env.SLACK_BOT_USER_OAUTH_TOKEN = 'unit-token';
    await promisify(execFile)(
      process.execPath,
      [
        ...coveragePreload(),
        '--preload',
        path.resolve('tests/helpers/capture-slack.ts'),
        path.resolve('cli.ts'),
        '-c',
        config,
        '-j',
        results,
      ],
      { env, timeout: 15000 },
    );
    const messages = (await readFile(capture, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(messages).toHaveLength(transport === 'bot' ? 2 : 1);
    const details = text(messages.at(-1).payload.blocks);
    expect(details).toContain(`<${options.baseUrl}/final.png|Screenshot>`);
    expect(details).toContain(`<${options.reportUrl}|HTML report>`);
    expect(details).not.toContain('old.png');
    if (transport === 'bot') {
      expect(text(messages[0].payload.blocks)).not.toContain('Screenshot');
      expect(messages[1].payload.thread_ts).toBe(messages[0].ts);
    }
  });
}
