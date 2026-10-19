import { describe, expect, test } from 'bun:test';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  candidates,
  compare,
  finalizeNotes,
  githubReleaseBody,
  integrity,
  packageName,
  stable,
  validateVersion,
  verifyArchive,
  verifyPublished,
  type Candidate,
} from '../scripts/release/model';
import {
  completeRelease,
  type ReleaseServices,
} from '../scripts/release/sequence';
import { json } from '../scripts/release/io';

const commit = 'a'.repeat(40);
const candidate: Candidate = {
  version: '1.1.118',
  commit,
  base: '0'.repeat(40),
};
const timestamp = '2026-10-18T03:02:45.460Z';
const now = new Date('2026-10-18T12:00:00Z');
const hash = integrity(new Uint8Array([1, 2, 3]));
const metadata = {
  name: packageName,
  version: candidate.version,
  gitHead: commit,
  dist: { integrity: hash },
};
const notes = `---
title: Release Notes
---

These notes cover changes from **17 October 2025 to 17 October 2026**.
[All releases](https://github.com/ryanrosello-og/playwright-slack-report/releases)

## 1.1.118 - Unreleased {#v11118}

Version 1.1.118 is prepared for release. It is not yet published.

### Added

- Hosted artifact links.

[Configuration](./configuration.md#artifactlinks)

## 1.1.117 - 11 October 2026

### Added

- Flaky tests.

## 1.0.0 - 17 October 2025

### Fixed

- Old change.
`;

describe('release planning', () => {
  test('real Git history bootstraps once, preserves queued versions, and ignores subsequent dependency merges', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'release-planner-'));
    const git = (...args: string[]) => {
      const result = Bun.spawnSync(
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
      expect(result.exitCode).toBe(0);
      return result.stdout.toString().trim();
    };
    const save = async (version: string) =>
      Bun.write(
        path.join(directory, 'package.json'),
        JSON.stringify({ name: packageName, version }),
      );
    const commitFiles = (message: string) => {
      git('add', '.');
      git('commit', '-m', message);
      const sha = git('rev-parse', 'HEAD');
      git('update-ref', 'refs/remotes/origin/main', sha);
      return sha;
    };
    const plan = async () => {
      const child = Bun.spawn(
        [
          process.execPath,
          path.resolve(import.meta.dir, '../scripts/release/plan.ts'),
        ],
        {
          cwd: directory,
          env: { ...process.env, GITHUB_OUTPUT: '', GITHUB_STEP_SUMMARY: '' },
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );
      const errors = await new Response(child.stderr).text();
      expect(await child.exited, errors).toBe(0);
      return Bun.file(path.join(directory, '.release/plan.json')).json();
    };
    try {
      git('init', '-b', 'main');
      await save('1.1.117');
      await Bun.write(path.join(directory, '.gitignore'), '.release/\n');
      commitFiles('previous release');
      await mkdir(path.join(directory, '.github'));
      await save('1.1.118');
      await Bun.write(
        path.join(directory, '.github/release-config.json'),
        '{"firstVersion":"1.1.118"}',
      );
      await Bun.write(
        path.join(directory, '.github/release-records.json'),
        '{}',
      );
      const first = commitFiles('enable automated releases');
      await Bun.write(path.join(directory, 'bun.lock'), 'dependency update');
      commitFiles('dependabot update');
      expect((await plan()).map((r: Candidate) => r.commit)).toEqual([first]);
      await save('1.1.119');
      const second = commitFiles('next version');
      expect((await plan()).map((r: Candidate) => r.commit)).toEqual([
        first,
        second,
      ]);
      await Bun.write(
        path.join(directory, '.github/release-records.json'),
        JSON.stringify({
          '1.1.118': { commit: first, integrity: hash, publishedAt: timestamp },
          '1.1.119': {
            commit: second,
            integrity: hash,
            publishedAt: timestamp,
          },
        }),
      );
      commitFiles('record completed releases');
      await Bun.write(
        path.join(directory, 'bun.lock'),
        'another dependency update',
      );
      commitFiles('another dependabot update');
      expect(await plan()).toEqual([]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 30000);

  test('dependency-only merges never create another release', () => {
    const dependencyMerge = { ...candidate, commit: 'b'.repeat(40) };
    const record = { commit, integrity: hash, publishedAt: timestamp };
    expect(
      candidates([candidate, dependencyMerge], { '1.1.118': record }),
    ).toEqual([]);
    expect(candidates([candidate, dependencyMerge], {})).toEqual([candidate]);
  });

  test('preserves every version and pins its first main commit', () => {
    const next = { ...candidate, version: '1.1.119', commit: 'c'.repeat(40) };
    expect(
      candidates(
        [candidate, { ...candidate, commit: 'b'.repeat(40) }, next],
        {},
      ),
    ).toEqual([candidate, next]);
  });

  test('rejects prereleases, reversions, and mismatched release records', () => {
    for (const version of ['1.2.0-beta.1', '01.2.3', 'v1.2.3', '1.2'])
      expect(() => stable(version)).toThrow();
    expect(() =>
      candidates([candidate, { ...candidate, version: '1.1.117' }], {}),
    ).toThrow('increase');
    expect(() =>
      candidates([candidate], {
        '1.1.118': {
          commit: 'b'.repeat(40),
          integrity: hash,
          publishedAt: timestamp,
        },
      }),
    ).toThrow('differs');
    expect(compare('1.1.99', '1.1.118')).toBe(-1);
    expect(compare('2.0.0', '1.99.999')).toBe(1);
  });

  test('validates package, CLI and release notes before publication', () => {
    const manifest = { name: packageName, version: candidate.version };
    expect(() =>
      validateVersion(manifest, ".version('1.1.118')", notes),
    ).not.toThrow();
    expect(() =>
      validateVersion(manifest, ".version('1.1.117')", notes),
    ).toThrow('differ');
    expect(() =>
      validateVersion(
        manifest,
        ".version('1.1.118')",
        notes.replace('## 1.1.118', '## 1.1.119'),
      ),
    ).toThrow('exactly one');
  });
});

describe('publication identity and recovery', () => {
  for (const scenario of [
    'success',
    'recover',
    'tag-conflict',
    'registry-outage',
    'main-race',
  ]) {
    test(`isolated publisher: ${scenario}`, async () => {
      const directory = await mkdtemp(
        path.join(tmpdir(), 'release-publisher-'),
      );
      try {
        const child = Bun.spawn(
          [
            process.execPath,
            path.join(import.meta.dir, 'fixtures/release-process.ts'),
          ],
          {
            cwd: directory,
            env: {
              ...process.env,
              GITHUB_ACTIONS: 'true',
              GITHUB_REF: 'refs/heads/main',
              GITHUB_REPOSITORY: 'ryanrosello-og/playwright-slack-report',
              RELEASE_TOKEN: 'test-only',
              RELEASE_TEST_SCENARIO: scenario,
              GITHUB_STEP_SUMMARY: '',
              GITHUB_OUTPUT: '',
            },
            stdout: 'pipe',
            stderr: 'pipe',
          },
        );
        const errors = await new Response(child.stderr).text();
        expect(await child.exited, errors).toBe(0);
        const result = await Bun.file(
          path.join(directory, 'result.json'),
        ).json();
        if (scenario === 'tag-conflict' || scenario === 'registry-outage') {
          expect(result.error).toContain(
            scenario === 'tag-conflict' ? 'never move' : '503',
          );
          expect(result.calls).toEqual([]);
        } else {
          expect(result.error).toBe('');
          expect(result.calls).toEqual(
            scenario === 'recover'
              ? ['record']
              : ['npm', 'tag', 'release', 'record'],
          );
          const notes = result.tree.find(
            (file: any) => file.path === 'website/docs/release-notes.md',
          ).content;
          const date = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(result.publishedAt));
          expect(notes).toContain(`## 1.1.118 - ${date} {#v11118}`);
          if (scenario === 'main-race')
            expect(notes).toContain('Concurrent change.');
          const records = JSON.parse(
            result.tree.find(
              (file: any) => file.path === '.github/release-records.json',
            ).content,
          );
          expect(records['1.1.118'].commit).toBe(commit);
        }
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }, 30000);
  }

  test('only a 404 represents an absent registry version', async () => {
    const request = (status: number) =>
      (async () => new Response('{}', { status })) as unknown as typeof fetch;
    expect(
      await json(
        'https://registry.npmjs.org/example/1.0.0',
        {},
        true,
        request(404),
      ),
    ).toBeUndefined();
    for (const status of [401, 403, 429, 500]) {
      await expect(
        json(
          'https://registry.npmjs.org/example/1.0.0',
          {},
          true,
          request(status),
        ),
      ).rejects.toThrow(`${status}`);
    }
  });

  test('requires the tested integrity and immutable source identity', () => {
    expect(() => verifyPublished(metadata, candidate, hash)).not.toThrow();
    expect(() =>
      verifyPublished(
        { ...metadata, gitHead: 'b'.repeat(40) },
        candidate,
        hash,
      ),
    ).toThrow('different commit');
    expect(() => verifyPublished(metadata, candidate, 'sha512-wrong')).toThrow(
      'tested archive',
    );
  });

  test('checks embedded archive metadata rather than trusting its filename', async () => {
    const archive = new Bun.Archive({
      'package/package.json': JSON.stringify(metadata),
    });
    const bytes = await archive.bytes();
    expect(await verifyArchive(bytes, candidate)).toBe(integrity(bytes));
    await expect(
      verifyArchive(bytes, { ...candidate, version: '1.1.119' }),
    ).rejects.toThrow();
    await expect(
      verifyArchive(bytes, { ...candidate, commit: 'b'.repeat(40) }),
    ).rejects.toThrow('identity');
  });

  function services(published = false) {
    const calls: string[] = [];
    const actions: ReleaseServices = {
      read: async () => ({
        metadata: published ? metadata : undefined,
        publishedAt: published ? timestamp : undefined,
        latest: published ? '1.1.118' : '1.1.117',
      }),
      publish: async () => {
        calls.push('publish');
        published = true;
      },
      tag: async () => {
        calls.push('tag');
      },
      release: async () => {
        calls.push('release');
      },
      record: async () => {
        calls.push('record');
      },
    };
    return { calls, actions };
  }

  test('publication must finish before tags, releases, or source edits', async () => {
    const { calls, actions } = services();
    await completeRelease(candidate, hash, actions);
    expect(calls).toEqual(['publish', 'tag', 'release', 'record']);
  });

  test('resumes after partial success without publishing twice', async () => {
    const { calls, actions } = services();
    actions.release = async () => {
      throw new Error('GitHub unavailable');
    };
    await expect(completeRelease(candidate, hash, actions)).rejects.toThrow(
      'GitHub unavailable',
    );
    expect(calls).toEqual(['publish', 'tag']);
    actions.release = async () => {
      calls.push('release');
    };
    await completeRelease(candidate, hash, actions);
    expect(calls).toEqual(['publish', 'tag', 'tag', 'release', 'record']);
  });

  test('an ambiguous publish response can recover only from verified registry data', async () => {
    const { calls, actions } = services();
    const publish = actions.publish;
    actions.publish = async () => {
      await publish();
      throw new Error('Connection lost');
    };
    await completeRelease(candidate, hash, actions);
    expect(calls).toEqual(['publish', 'tag', 'release', 'record']);
  });

  test('a failed publication leaves release notes and GitHub unchanged', async () => {
    const { calls, actions } = services();
    actions.publish = async () => {
      throw new Error('npm unavailable');
    };
    await expect(completeRelease(candidate, hash, actions)).rejects.toThrow(
      'npm unavailable',
    );
    expect(calls).toEqual([]);
  });

  test('never overwrites a version collision or moves latest backward', async () => {
    const { calls, actions } = services(true);
    actions.read = async () => ({
      metadata: { ...metadata, gitHead: 'b'.repeat(40) },
      publishedAt: timestamp,
      latest: '1.1.118',
    });
    await expect(completeRelease(candidate, hash, actions)).rejects.toThrow(
      'different commit',
    );
    actions.read = async () => ({ latest: '1.1.119' });
    await expect(completeRelease(candidate, hash, actions)).rejects.toThrow(
      'backward',
    );
    expect(calls).toEqual([]);
  });
});

describe('release notes', () => {
  test('uses npm UTC date, preserves anchors and links, and trims the rolling window', () => {
    const result = finalizeNotes(notes, '1.1.118', timestamp, now);
    expect(result).toContain('## 1.1.118 - 18 October 2026 {#v11118}');
    expect(result).not.toContain('not yet published');
    expect(result).toContain('/releases/tag/v1.1.118');
    expect(result).toContain('18 October 2025 to 18 October 2026');
    expect(result).not.toContain('## 1.0.0');
    expect(result).toContain('[All releases]');
    expect(finalizeNotes(result, '1.1.118', timestamp, now)).toBe(result);
    expect(githubReleaseBody(result, '1.1.118')).toContain(
      '/docs/configuration/#artifactlinks',
    );
  });

  test('preserves newer pending versions during an older release recovery', () => {
    const newer = notes.replace(
      '## 1.1.118',
      '## 1.1.119 - Unreleased\n\n### Added\n\n- Next change.\n\n## 1.1.118',
    );
    const result = finalizeNotes(newer, '1.1.118', timestamp, now);
    expect(result).toContain('## 1.1.119 - Unreleased');
    expect(result).toContain('## 1.1.118 - 18 October 2026');
  });

  test('rejects unknown, future and conflicting publication dates', () => {
    expect(() => finalizeNotes(notes, '1.1.118', 'invalid', now)).toThrow(
      'Invalid',
    );
    expect(() => finalizeNotes(notes, '1.1.118', '2027-01-01', now)).toThrow(
      'future',
    );
    const finalized = finalizeNotes(notes, '1.1.118', timestamp, now);
    expect(() =>
      finalizeNotes(finalized, '1.1.118', '2026-10-17', now),
    ).toThrow('disagrees');
  });
});
