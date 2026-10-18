import { expect, test } from 'bun:test';
import type { SummaryResults } from '../src';
import generateCustomLayoutSimpleExample from '../custom_block/simple';

const successful: SummaryResults = {
  passed: 1,
  failed: 0,
  flaky: 0,
  skipped: 0,
  failures: [],
  tests: [
    {
      suiteName: 'Checkout',
      name: 'completes an order',
      startedAt: '2026-10-18T09:00:00.000Z',
      endedAt: '2026-10-18T09:00:01.000Z',
      reason: '',
      retry: 0,
      status: 'passed',
    },
  ],
};

function renderSummary(overrides: Partial<SummaryResults> = {}): string {
  return JSON.stringify(
    generateCustomLayoutSimpleExample({ ...successful, ...overrides }),
  );
}

const successfulStatuses = [
  ['not provided', undefined],
  ['passed', 'passed'],
] as const;

test.each(successfulStatuses)(
  'simple layout shows success for a clean run with status %s',
  (_label, runStatus) => {
    expect(renderSummary({ runStatus, runErrors: [] })).toContain(
      'All tests passed!',
    );
  },
);

test.each(successfulStatuses)(
  'simple layout keeps test failures visible with status %s',
  (_label, runStatus) => {
    const output = renderSummary({
      runStatus,
      passed: 0,
      failed: 1,
      failures: [
        {
          suite: 'Checkout',
          test: 'completes an order',
          failureReason: 'Timeout',
        },
      ],
      tests: [{ ...successful.tests[0], status: 'failed', reason: 'Timeout' }],
    });
    expect(output).not.toContain('All tests passed!');
    expect(output).toContain('1 failure(s) out of 1 tests');
  },
);

test.each(['failed', 'timedout', 'interrupted'] as const)(
  'simple layout reports run status %s with zero failed tests',
  (runStatus) => {
    const output = renderSummary({ runStatus });
    expect(output).not.toContain('All tests passed!');
    expect(output).toContain(`Run ${runStatus}`);
    expect(output).toContain('0 failure(s) out of 1 tests');
  },
);

test.each(successfulStatuses)(
  'simple layout reports global errors with status %s',
  (_label, runStatus) => {
    const output = renderSummary({
      runStatus,
      runErrors: ['Global teardown failed', 'Worker exited unexpectedly'],
    });
    expect(output).not.toContain('All tests passed!');
    expect(output).toContain('Run failed');
    expect(output).toContain('2 global error(s)');
  },
);
