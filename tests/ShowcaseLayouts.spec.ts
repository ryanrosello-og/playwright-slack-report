import { expect, test } from 'bun:test';
import type { SummaryResults } from '../src';
import {
  generateBuildSummary,
  generateFailureTriage,
  generateFailureArtifacts,
  generateFlakyWatch,
  generateRunContext,
} from '../custom_block/showcase';

const layouts = [
  generateBuildSummary,
  generateFailureTriage,
  generateFailureArtifacts,
  generateFlakyWatch,
  generateRunContext,
];
const empty: SummaryResults = {
  passed: 0,
  failed: 0,
  flaky: 0,
  skipped: 0,
  failures: [],
  tests: [],
};

test('artifact template places escaped hosted links after the matching failure', () => {
  const blocks = generateFailureArtifacts({
    ...empty,
    failed: 2,
    failures: [
      {
        suite: 'Checkout',
        test: 'Payment',
        failureReason: 'Timed out',
        artifacts: [
          {
            name: 'Screenshot <view> & retry|1',
            url: 'https://example.com/payment.png?run=1&retry=2',
          },
          { name: 'Trace', url: 'https://example.com/trace.zip' },
          { name: 'HTML report', url: 'https://example.com/report/' },
          { name: 'Duplicate', url: 'https://example.com/trace.zip' },
        ],
      },
      { suite: 'Account', test: 'Reset', failureReason: 'Service unavailable' },
    ],
  });
  const failure = blocks.findIndex(
    (block) => block.type === 'section' && block.text?.text.includes('Payment'),
  );
  const links = blocks[failure + 1];
  expect(links.type).toBe('section');
  expect(JSON.stringify(links)).toContain(
    'payment.png?run=1&amp;retry=2|Screenshot &lt;view&gt; &amp; retry 1',
  );
  expect(JSON.stringify(links)).toContain('trace.zip|Trace');
  expect(JSON.stringify(links)).toContain('/report/|HTML report');
  expect(JSON.stringify(links)).not.toContain('Duplicate');
  expect(JSON.stringify(blocks)).toContain(
    'No hosted artifact links available.',
  );
});

test('artifact template rejects unsafe URLs and limits links without cutting them', () => {
  const artifacts = [
    ...[
      'javascript:alert(1)',
      'file:///private',
      'not a URL',
      'https://user:password@example.com',
      'https://example.com/<bad|link>',
      'https://example.com/a b',
    ].map((url) => ({ name: 'Unsafe', url })),
    { name: 'Oversized', url: `https://example.com/${'x'.repeat(1000)}` },
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Screenshot ${i}`,
      url: `https://example.com/${i}.png`,
    })),
  ];
  const summary = {
    ...empty,
    failed: 100,
    failures: Array.from({ length: 100 }, () => ({
      suite: 'suite',
      test: 'test',
      failureReason: 'failure',
      artifacts,
    })),
  };
  const original = JSON.stringify(summary);
  const blocks = generateFailureArtifacts(summary);
  const output = JSON.stringify(blocks);
  expect(blocks.length).toBeLessThanOrEqual(50);
  expect(output).not.toContain('Unsafe');
  expect(output).not.toContain('Oversized');
  expect(output).toContain('28 additional artifact links omitted');
  expect(output).toContain('97 more error/failure entries omitted');
  const links = blocks.filter(
    (block) => block.type === 'section' && block.text?.type === 'mrkdwn',
  );
  expect(links).toHaveLength(3);
  for (const block of links) {
    if (block.type !== 'section') continue;
    expect(block.text!.text.length).toBeLessThanOrEqual(3000);
    expect(block.text!.text.match(/<https:/g)).toHaveLength(3);
    expect(block.text!.text.endsWith('>')).toBe(true);
  }
  expect(JSON.stringify(summary)).toBe(original);
});

test('showcase layouts keep global failures, timeouts and interruptions visible with zero failed tests', () => {
  for (const layout of layouts) {
    for (const runStatus of ['failed', 'timedout', 'interrupted'] as const) {
      const result = JSON.stringify(
        layout({ ...empty, passed: 10, runStatus }),
      );
      expect(result).not.toContain('✅ Run passed');
      expect(result).toContain(
        {
          failed: 'Run failed',
          timedout: 'Run timed out',
          interrupted: 'Run interrupted',
        }[runStatus],
      );
    }
    expect(
      JSON.stringify(
        layout({
          ...empty,
          passed: 10,
          runStatus: 'passed',
          runErrors: ['setup failed'],
        }),
      ),
    ).toContain('Run failed');
    expect(JSON.stringify(layout(empty))).not.toContain('✅ Run passed');
  }
});

test('examples bound large reports to Slack block and text limits without changing the input', () => {
  const long = '<!channel> & '.repeat(1000);
  const summary: SummaryResults = {
    ...empty,
    failed: 100,
    flaky: 100,
    runErrors: Array(100).fill(long),
    failures: Array.from({ length: 100 }, () => ({
      suite: long,
      test: long,
      failureReason: long,
    })),
    flakyTests: Array.from({ length: 100 }, () => ({
      suite: long,
      test: long,
      retries: 2,
      projectName: long,
    })),
    meta: ['Branch', 'Build', 'Owner', 'Environment', 'Commit', 'Suite'].map(
      (key) => ({ key, value: long }),
    ),
  };
  const original = JSON.stringify(summary);
  for (const layout of layouts) {
    const blocks = layout(summary);
    expect(blocks.length).toBeLessThanOrEqual(50);
    for (const block of blocks) {
      if (block.type === 'header')
        expect(block.text.text.length).toBeLessThanOrEqual(150);
      if (block.type === 'section') {
        if (block.text) {
          expect(block.text.text.length).toBeGreaterThan(0);
          expect(block.text.text.length).toBeLessThanOrEqual(3000);
          expect(block.text.type).toBe('plain_text');
        }
        expect(block.fields?.length ?? 0).toBeLessThanOrEqual(10);
        for (const field of block.fields ?? []) {
          expect(field.text.length).toBeLessThanOrEqual(2000);
          expect(field.type).toBe('plain_text');
        }
      }
    }
  }
  expect(JSON.stringify(summary)).toBe(original);
  expect(JSON.stringify(generateFailureTriage(summary))).toContain(
    '195 more error/failure entries omitted',
  );
  expect(JSON.stringify(generateFlakyWatch(summary))).toContain(
    '96 more flaky tests omitted',
  );
});

test('flaky watch uses explicit flaky details and handles older summaries without them', () => {
  const legacy = { ...empty, flaky: 2 };
  expect(JSON.stringify(generateFlakyWatch(legacy))).toContain(
    'No flaky-test details were recorded',
  );
  const result = JSON.stringify(
    generateFlakyWatch({
      ...legacy,
      flakyTests: [
        {
          suite: 'checkout',
          test: 'payment',
          projectName: 'webkit',
          retries: 2,
        },
        { suite: 'search', test: 'filters', retries: 1 },
      ],
    }),
  );
  expect(result).toContain('3 retries across recorded flaky details');
  expect(result).toContain('Project: webkit');
});

test('optional report links accept HTTP URLs and omit invalid or unsafe values', () => {
  for (const layout of layouts) {
    const result = JSON.stringify(
      layout({
        ...empty,
        meta: [
          {
            key: 'Report URL',
            value: 'https://example.com/report?build=1&suite=2',
          },
          { key: 'Build URL', value: 'javascript:alert(1)' },
        ],
      }),
    );
    expect(result).toContain(
      'https://example.com/report?build=1&amp;suite=2|Open HTML report',
    );
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('View CI build');
    const expandedUrl = `https://example.com/?${'&'.repeat(700)}`;
    expect(
      JSON.stringify(
        layout({
          ...empty,
          meta: [
            { key: 'Report URL', value: expandedUrl },
            { key: 'Build URL', value: expandedUrl },
          ],
        }),
      ),
    ).not.toContain('type":"mrkdwn');
    expect(() =>
      layout({ ...empty, meta: [{ key: 'Report URL', value: 'not a URL' }] }),
    ).not.toThrow();
  }
});
