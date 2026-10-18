import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as prettier from 'prettier';

function git(root: string, args: string[]): string {
  const result = Bun.spawnSync(['git', ...args], { cwd: root });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || 'Git command failed');
  }
  return result.stdout.toString();
}

export function changedFiles(root: string, baseRef?: string): string[] {
  // Report missing repositories or ownership errors before trying fallback refs.
  git(root, ['rev-parse', '--show-toplevel']);
  let base: string;
  if (baseRef && !/^0+$/.test(baseRef)) {
    // Fail explicitly when CI supplied a missing ref instead of skipping its files.
    base = git(root, ['merge-base', baseRef, 'HEAD']).trim();
  } else {
    const candidates = [
      'upstream/main',
      'origin/main',
      'main',
      'upstream/master',
      'origin/master',
      'master',
    ];
    const ref = candidates.find(
      (candidate) =>
        Bun.spawnSync(['git', 'rev-parse', '--verify', candidate], {
          cwd: root,
        }).exitCode === 0,
    );
    base = ref ? git(root, ['merge-base', ref, 'HEAD']).trim() : 'HEAD';
    if (!ref) {
      console.warn(
        'No main/master ref found. Checking local changes only. Set FORMAT_BASE_REF to include committed changes.',
      );
    }
  }

  return [
    ...new Set(
      [
        git(root, [
          'diff',
          '--name-only',
          '-z',
          '--diff-filter=ACMR',
          base,
          '--',
        ]),
        git(root, ['ls-files', '--others', '--exclude-standard', '-z']),
      ]
        .join('\0')
        .split('\0')
        .filter(Boolean),
    ),
  ].sort();
}

export async function formatChanges(
  root: string,
  write = false,
  baseRef?: string,
) {
  let checked = 0;
  const failures: string[] = [];
  for (const file of changedFiles(root, baseRef)) {
    const filepath = path.join(root, file);
    const info = await prettier.getFileInfo(filepath, {
      ignorePath: [
        path.join(root, '.gitignore'),
        path.join(root, '.prettierignore'),
      ],
    });
    if (info.ignored || !info.inferredParser) continue;
    checked += 1;
    const source = await readFile(filepath, 'utf8');
    const options = { ...(await prettier.resolveConfig(filepath)), filepath };
    if (write) {
      const formatted = await prettier.format(source, options);
      if (formatted !== source) {
        await writeFile(filepath, formatted);
        console.log(`Formatted ${file}`);
      }
    } else if (!(await prettier.check(source, options))) {
      failures.push(file);
    }
  }
  console.log(`${write ? 'Formatted' : 'Checked'} ${checked} changed files.`);
  if (failures.length) {
    console.error(failures.join('\n'));
    console.error('Run bun run format to fix these files.');
  }
  return failures.length === 0;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--write')) {
    throw new Error('Usage: bun scripts/format.ts [--write]');
  }
  const root = path.resolve(import.meta.dir, '..');
  process.exitCode = (await formatChanges(
    root,
    args.includes('--write'),
    process.env.FORMAT_BASE_REF,
  ))
    ? 0
    : 1;
}
