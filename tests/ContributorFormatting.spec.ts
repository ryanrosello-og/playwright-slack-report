import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { changedFiles, formatChanges } from '../scripts/format';

describe('contributor formatting', () => {
  let root: string;
  const prefix = path.join(os.tmpdir(), 'slack-report-format-');

  function git(...args: string[]) {
    const result = Bun.spawnSync(['git', ...args], { cwd: root });
    if (result.exitCode !== 0) throw new Error(result.stderr.toString());
    return result.stdout.toString().trim();
  }

  function commit() {
    git('add', '.');
    git(
      '-c',
      'user.name=Contributor Test',
      '-c',
      'user.email=contributor@example.invalid',
      'commit',
      '-m',
      'fixture',
    );
  }

  beforeEach(async () => {
    root = await mkdtemp(prefix);
    git('init', '--template=', '-b', 'main');
    git('config', 'core.autocrlf', 'false');
    git('config', 'commit.gpgsign', 'false');
    git('config', 'core.hooksPath', path.join(root, '.git', 'hooks'));
    await writeFile(path.join(root, 'legacy.ts'), 'const legacy={old:true}');
    await writeFile(path.join(root, 'deleted.ts'), 'const deleted = true;\n');
    await writeFile(path.join(root, '.gitignore'), 'generated.ts\n');
    await writeFile(path.join(root, '.prettierignore'), 'invalid.json\n');
    commit();
  });

  afterEach(async () => {
    if (!root || !path.resolve(root).startsWith(prefix)) {
      throw new Error('Refusing to remove an unexpected test directory');
    }
    await rm(root, { recursive: true, force: true });
  });

  test('includes committed, staged, unstaged, renamed, and untracked paths', async () => {
    git('switch', '-c', 'contribution');
    await writeFile(
      path.join(root, 'committed.ts'),
      'const committed = true;\n',
    );
    commit();
    await writeFile(path.join(root, 'staged.ts'), 'const staged = true;\n');
    git('add', 'staged.ts');
    await writeFile(
      path.join(root, 'committed.ts'),
      'const committed = false;\n',
    );
    git('mv', 'legacy.ts', 'renamed file.ts');
    await writeFile(path.join(root, 'new file.ts'), 'const added = true;\n');
    await writeFile(path.join(root, 'generated.ts'), 'const generated={a:1}');
    await rm(path.join(root, 'deleted.ts'));

    expect(changedFiles(root)).toEqual([
      'committed.ts',
      'new file.ts',
      'renamed file.ts',
      'staged.ts',
    ]);
  });

  test('checks and fixes only changed supported files, preserving ignored fixtures', async () => {
    await writeFile(path.join(root, 'new file.ts'), 'const value={a:1}');
    await writeFile(path.join(root, 'invalid.json'), '');
    await writeFile(path.join(root, 'unsupported.data'), 'unformatted input');

    expect(await formatChanges(root)).toBe(false);
    expect(await formatChanges(root, true)).toBe(true);
    expect(await formatChanges(root)).toBe(true);
    expect(await readFile(path.join(root, 'new file.ts'), 'utf8')).toBe(
      'const value = { a: 1 };\n',
    );
    expect(await readFile(path.join(root, 'legacy.ts'), 'utf8')).toBe(
      'const legacy={old:true}',
    );
    expect(await readFile(path.join(root, 'invalid.json'), 'utf8')).toBe('');
  });

  test('uses an explicit CI base even when the local main ref points at HEAD', async () => {
    const base = git('rev-parse', 'HEAD');
    await writeFile(path.join(root, 'pushed.ts'), 'const pushed = true;\n');
    commit();
    expect(changedFiles(root)).toEqual([]);
    expect(changedFiles(root, base)).toEqual(['pushed.ts']);
  });

  test('fails for an invalid supplied base instead of silently skipping files', () => {
    expect(() => changedFiles(root, 'missing-ci-base')).toThrow();
  });

  test('rejects directories outside a Git working tree', () => {
    expect(() => changedFiles(path.join(root, '.git'))).toThrow();
  });

  test('uses local changes when no main or master ref exists', async () => {
    git('branch', '-m', 'contribution');
    await writeFile(path.join(root, 'local.ts'), 'const local = true;\n');
    expect(changedFiles(root)).toEqual(['local.ts']);
    expect(
      changedFiles(root, '0000000000000000000000000000000000000000'),
    ).toEqual(['local.ts']);
  });
});
