import { expect, test } from 'bun:test';
import { generateBlocks, generateFailures, generateFlakyTests } from '../src/LayoutGenerator';
import { SummaryResults } from '../src';
import { messageText, verifyFailureAndFlakyDetails } from '../harness/verify-message.mjs';

const summary: SummaryResults = {
  passed: 1, failed: 3, flaky: 1, skipped: 2, tests: [],
  failures: [
    { suite: 'suite', test: 'permanent failure [chromium]', failureReason: 'Deliberate failure' },
    { suite: 'suite', test: 'unexpected pass [chromium]', failureReason: 'Expected failure passed' },
    { suite: 'suite', test: 'serial failure [chromium]', failureReason: 'Deliberate serial failure' },
  ],
  flakyTests: [{ suite: 'suite', test: 'flaky retry [chromium]', retries: 1 }],
};

for (const threaded of [false, true]) {
  for (const shortcodes of [false, true]) {
    test(`harness accepts separate failures and recovered flaky details (${threaded ? 'bot thread' : 'webhook inline'}, ${shortcodes ? 'Slack shortcodes' : 'Unicode'})`, async () => {
      const blocks = threaded
        ? [...await generateFailures(summary, 10), ...generateFlakyTests(summary)]
        : await generateBlocks(summary, 10);
      const slackBlocks = shortcodes
        ? JSON.parse(JSON.stringify(blocks).replace(/🟡/g, ':large_yellow_circle:'))
        : blocks;
      // Keep section classification across message boundaries, as in chunked threads.
      const messages = threaded
        ? [{ blocks: slackBlocks.slice(0, 5) }, { blocks: slackBlocks.slice(5) }]
        : [{ blocks: slackBlocks }];
      expect(() => verifyFailureAndFlakyDetails(messages)).not.toThrow();
    });
  }
}

test('harness still rejects a recovered flaky test included among failures', async () => {
  const blocks = await generateBlocks({
    ...summary, failures: [...summary.failures, { suite: 'suite', test: 'flaky retry [chromium]', failureReason: 'Initial failure' }],
  }, 10);
  expect(() => verifyFailureAndFlakyDetails([{ blocks }])).toThrow('Recovered flaky test reported as a failure');
});

test('harness rejects missing flaky details, duplicate entries and incorrect retry counts', async () => {
  const missing = await generateBlocks({ ...summary, flakyTests: [] }, 10);
  expect(() => verifyFailureAndFlakyDetails([{ blocks: missing }])).toThrow('Missing flaky test section');
  const empty = await generateBlocks({ ...summary, flakyTests: [{ suite: 'suite', test: 'different test', retries: 1 }] }, 10);
  expect(() => verifyFailureAndFlakyDetails([{ blocks: empty }])).toThrow('Expected one recovered flaky test detail');
  const duplicate = await generateBlocks({ ...summary, flakyTests: [...summary.flakyTests!, ...summary.flakyTests!] }, 10);
  expect(() => verifyFailureAndFlakyDetails([{ blocks: duplicate }])).toThrow('Expected one recovered flaky test detail');
  const wrongRetries = await generateBlocks({ ...summary, flakyTests: [{ ...summary.flakyTests![0], retries: 3 }] }, 10);
  expect(() => verifyFailureAndFlakyDetails([{ blocks: wrongRetries }])).toThrow('Incorrect flaky test retry count');
});

test('harness still requires each failure name and assertion reasons in the failure section', async () => {
  for (const failure of summary.failures) {
    const blocks = await generateBlocks({ ...summary, failures: summary.failures.filter(entry => entry !== failure) }, 10);
    expect(() => verifyFailureAndFlakyDetails([{ blocks }])).toThrow(`Missing failure details: ${failure.test.split(' [')[0]}`);
  }
  for (const reason of ['Deliberate failure', 'Deliberate serial failure']) {
    const blocks = await generateBlocks({ ...summary, failures: summary.failures.map(entry => ({
      ...entry, failureReason: entry.failureReason === reason ? 'Different reason' : entry.failureReason,
    })) }, 10);
    expect(() => verifyFailureAndFlakyDetails([{ blocks }])).toThrow(reason === 'Deliberate failure'
      ? 'Missing assertion failure reason' : 'Missing serial failure reason');
  }
});

test('Slack shortcode normalization still includes block fields and summary emoji', () => {
  expect(messageText({ blocks: [{ text: { text: ':white_check_mark: :x: :large_yellow_circle: :fast_forward:' },
    fields: [{ text: 'metadata' }] }, { type: 'divider' }] })).toContain('✅ ❌ 🟡 ⏩\nmetadata');
  expect(messageText({})).toBe('');
});
