import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import {
  candidates,
  configPath,
  recordsPath,
  type Candidate,
  type Records,
} from './model';
import { command, output, summary } from './io';

const main = await command(['git', 'rev-parse', 'origin/main']);
const config = JSON.parse(
  await command(['git', 'show', `${main}:${configPath}`]),
);
const records: Records = JSON.parse(
  await command(['git', 'show', `${main}:${recordsPath}`]),
);
// Start with the commit that introduces automation, not old unpublished history.
const anchors = await command([
  'git',
  'log',
  '--first-parent',
  '--reverse',
  '--diff-filter=A',
  '--format=%H',
  main,
  '--',
  configPath,
]);
const anchor = anchors.split('\n')[0];
assert(
  /^[a-f0-9]{40}$/.test(anchor),
  'Release automation start commit was not found',
);
const commits = (
  await command([
    'git',
    'rev-list',
    '--first-parent',
    '--reverse',
    `${anchor}^..${main}`,
  ])
).split('\n');
const history: Candidate[] = [];
for (const commit of commits) {
  const manifest = JSON.parse(
    await command(['git', 'show', `${commit}:package.json`]),
  );
  history.push({
    version: manifest.version,
    commit,
    base:
      history.at(-1)?.commit ||
      (await command(['git', 'rev-parse', `${commit}^`])),
  });
}
assert.equal(
  history[0].version,
  config.firstVersion,
  'Bootstrap version differs from release configuration',
);
const pending = candidates(history, records);
assert(
  pending.length <= 100,
  'More than 100 versions are pending; investigate the release backlog',
);
await mkdir('.release', { recursive: true });
await Bun.write('.release/plan.json', JSON.stringify(pending, null, 2));
await output('candidates', JSON.stringify(pending));
await output('pending', String(pending.length > 0));
await output('main', main);
await summary(
  pending.length
    ? `Pending releases: ${pending.map((r) => `${r.version} (${r.commit})`).join(', ')}.`
    : 'No unpublished release work remains. Refresh the documentation deployment if a previous deployment failed.',
);
