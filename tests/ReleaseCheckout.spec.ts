import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('release checkout rejects untrusted revisions before changing HEAD', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'release-checkout-'));
  const git = (...args: string[]) => {
    const child = Bun.spawnSync(
      [
        'git',
        '-c',
        'user.name=Release test',
        '-c',
        'user.email=release@example.invalid',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { cwd: directory },
    );
    expect(child.exitCode, child.stderr.toString()).toBe(0);
    return child.stdout.toString().trim();
  };
  const checkout = async (commit: string, base?: string) => {
    const env: NodeJS.ProcessEnv = { ...process.env, RELEASE_COMMIT: commit };
    delete env.RELEASE_BASE;
    if (base !== undefined) env.RELEASE_BASE = base;
    const child = Bun.spawn(
      [
        process.execPath,
        path.resolve(import.meta.dir, '../scripts/release/checkout.ts'),
      ],
      { cwd: directory, env, stdout: 'pipe', stderr: 'pipe' },
    );
    const error = await new Response(child.stderr).text();
    return { code: await child.exited, error };
  };
  try {
    git('init', '-b', 'main');
    git('commit', '--allow-empty', '-m', 'initial main');
    const initial = git('rev-parse', 'HEAD');
    git('switch', '-c', 'contribution');
    await Bun.write(path.join(directory, 'candidate.txt'), 'unreviewed source');
    git('add', '.');
    git('commit', '-m', 'contribution');
    const contribution = git('rev-parse', 'HEAD');
    git('switch', 'main');
    git('update-ref', 'refs/remotes/origin/main', initial);

    const rejected = async (
      commit: string,
      base: string | undefined,
      error: string,
    ) => {
      const before = git('rev-parse', 'HEAD');
      const result = await checkout(commit, base);
      expect(result.code).not.toBe(0);
      expect(result.error).toContain(error);
      expect(git('rev-parse', 'HEAD')).toBe(before);
    };
    await rejected(contribution, initial, 'not on main first-parent history');
    expect(await Bun.file(path.join(directory, 'candidate.txt')).exists()).toBe(
      false,
    );
    for (const revision of [
      'contribution',
      '--help',
      'HEAD',
      `${initial}\n`,
      'f'.repeat(40),
    ])
      await rejected(
        revision,
        initial,
        revision === 'f'.repeat(40) ? 'not on main' : 'full release commit SHA',
      );

    git('merge', '--no-ff', 'contribution', '-m', 'reviewed merge');
    const merged = git('rev-parse', 'HEAD');
    git('commit', '--allow-empty', '-m', 'later main change');
    const latest = git('rev-parse', 'HEAD');
    git('update-ref', 'refs/remotes/origin/main', latest);
    // An ancestor on the PR's side of a merge is not an approved main snapshot.
    await rejected(contribution, initial, 'not on main first-parent history');
    await rejected(merged, latest, 'first parent');
    await rejected(merged, 'main', 'full release base SHA');

    // Recovery can still validate the original release after main advances.
    expect(await checkout(merged, initial)).toEqual({
      code: 0,
      error: expect.any(String),
    });
    expect(git('rev-parse', 'HEAD')).toBe(merged);
    // The publisher validates its main snapshot without a formatting base.
    expect((await checkout(latest)).code).toBe(0);
    expect(git('rev-parse', 'HEAD')).toBe(latest);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30000);
