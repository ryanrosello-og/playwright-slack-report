import { expect, test } from 'bun:test';
import ResultsParser from '../src/ResultsParser';

test('JSON result insertion preserves timestamps, tags, attachments and failure details', async () => {
  const parser = new ResultsParser();
  const attachments = [{ name: 'trace', path: 'trace.zip', contentType: 'application/zip' }];
  parser.addTestResultFromJson({
    suiteName: 'checkout', spec: { title: 'payment', tags: ['@smoke'] } as any,
    projectBrowserMapping: [{ projectName: 'desktop', browser: 'chromium' }], retries: 0,
    testCase: { results: [{
      status: 'failed', retry: 0, startTime: '2026-01-01T00:00:00Z', duration: 125,
      errors: [{ message: '\u001b[31mdeclined\u001b[0m' }], attachments,
    }] },
  });
  const result = await parser.getParsedResults([]);
  expect(result.tests).toEqual([expect.objectContaining({
    suiteName: 'checkout', name: 'payment', browser: 'chromium', projectName: 'desktop',
    startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:00:00.125Z',
    tags: ['@smoke'], attachments, reason: 'declined\r\n\r\n',
  })]);
  expect(result.failures).toEqual([{
    suite: 'checkout', test: 'payment [Project Name: desktop] using chromium',
    failureReason: 'declined\r\n\r\n',
  }]);
});

test('missing browser mapping preserves the plain test name', async () => {
  const parser = new ResultsParser();
  parser.addTestResult('suite', {
    title: 'test', _projectId: 'unknown', retries: 0, results: [{
      status: 'timedOut', retry: 0, startTime: '2026-01-01T00:00:00Z', duration: 1,
      errors: [], error: { message: 'timeout' },
    }],
  }, []);
  expect((await parser.getFailures())[0]).toEqual({
    suite: 'suite', test: 'test', failureReason: 'timeout \n ',
  });
});

test('empty test attempts produce no results and file locations override spec files', async () => {
  const parser = new ResultsParser();
  const results = await parser.parseTests('suite', [{
    title: 'test', file: 'spec.ts', tests: [
      { results: [] },
      { projectName: 'desktop', location: { file: 'actual.ts' }, results: [{
        status: 'unexpected', retry: 2, startTime: '2026-01-01T00:00:00Z', duration: 0,
        error: { snippet: 'failure' },
      }] },
    ],
  }], 1);
  expect(results).toEqual([expect.objectContaining({
    file: 'actual.ts', status: 'failed', retry: 2, retries: 2, reason: 'failure\r\n',
  })]);
});

test('expected failure annotations may be absent or unrelated', () => {
  const parser = new ResultsParser();
  expect(parser.getExpectedFailure({})).toBe('');
  expect(parser.getExpectedFailure({ annotations: [{ type: 'skip', description: 'unrelated' }] })).toBe('');
  expect(parser.getExpectedFailure({ annotations: [{ type: 'fail', description: 'known bug' }] })).toBe('known bug');
});
