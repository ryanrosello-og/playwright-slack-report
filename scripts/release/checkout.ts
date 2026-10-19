import assert from 'node:assert/strict';
import { command } from './io';

// Run this guard from the literal main checkout, before executing candidate code.
// A planner output is data, not authorization to execute an arbitrary revision.
const commit = process.env.RELEASE_COMMIT || '';
const base = process.env.RELEASE_BASE;
assert(/^[a-f0-9]{40}$/.test(commit), 'Expected a full release commit SHA');
if (base !== undefined)
  assert(/^[a-f0-9]{40}$/.test(base), 'Expected a full release base SHA');

const history = (
  await command([
    'git',
    'rev-list',
    '--first-parent',
    'refs/remotes/origin/main',
  ])
).split('\n');
assert(
  history.includes(commit),
  'Release source is not on main first-parent history',
);
if (base !== undefined)
  assert.equal(
    await command(['git', 'rev-parse', `${commit}^`]),
    base,
    'Release base must be the source commit first parent',
  );

await command([
  'git',
  '-c',
  'core.hooksPath=/dev/null',
  'checkout',
  '--detach',
  commit,
]);
