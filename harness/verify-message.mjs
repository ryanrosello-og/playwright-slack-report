import assert from 'node:assert/strict';

export function messageText(message) {
  const text = (message.blocks || []).flatMap(block => [block.text?.text || '', ...(block.fields || []).map(field => field.text)]).join('\n');
  // Slack converts Unicode emoji into shortcode names when returning messages.
  const emoji = { white_check_mark: '✅', x: '❌', large_yellow_circle: '🟡', fast_forward: '⏩' };
  return text.replace(/:(white_check_mark|x|large_yellow_circle|fast_forward):/g, (_, name) => emoji[name]);
}

// Inspect the failure and flaky sections independently, including chunked threads.
export function verifyFailureAndFlakyDetails(messages) {
  const blocks = messages.flatMap(message => message.blocks || []);
  const flakyHeader = blocks.findIndex(block => messageText({ blocks: [block] }).trim() === '🟡 *Flaky tests*');
  assert(flakyHeader >= 0, 'Missing flaky test section');
  const failureDetails = messageText({ blocks: blocks.slice(0, flakyHeader) });
  for (const name of ['permanent failure', 'unexpected pass', 'serial failure']) {
    assert(failureDetails.includes(name), `Missing failure details: ${name}`);
  }
  assert(failureDetails.includes('Deliberate failure'), 'Missing assertion failure reason');
  assert(failureDetails.includes('Deliberate serial failure'), 'Missing serial failure reason');
  assert(!failureDetails.includes('flaky retry'), 'Recovered flaky test reported as a failure');
  const flakyDetails = blocks.slice(flakyHeader + 1)
    .filter(block => messageText({ blocks: [block] }).includes('flaky retry'));
  assert.equal(flakyDetails.length, 1, 'Expected one recovered flaky test detail');
  assert.match(messageText({ blocks: flakyDetails }), /\n1 retry\s*$/, 'Incorrect flaky test retry count');
}
