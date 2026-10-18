import { getFileInfo } from 'prettier';
import { command } from './io';

// Check supported, tracked files changed since the previous release candidate.
// Passing filenames as arguments also handles spaces without shell expansion.
const base = process.argv[2];
if (!base || !/^[a-f0-9]{40}$/.test(base))
  throw new Error('Supply a full base commit SHA');
const changed = await command([
  'git',
  'diff',
  '--name-only',
  '--diff-filter=ACMR',
  '-z',
  base,
  'HEAD',
]);
const files: string[] = [];
for (const file of changed.split('\0').filter(Boolean)) {
  const info = await getFileInfo(file, { ignorePath: '.prettierignore' });
  if (!info.ignored && info.inferredParser) files.push(file);
}
for (let offset = 0; offset < files.length; offset += 50) {
  console.log(
    await command([
      process.execPath,
      '--bun',
      'x',
      'prettier',
      '--check',
      ...files.slice(offset, offset + 50),
    ]),
  );
}
