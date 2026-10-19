import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  finalizeNotes,
  githubReleaseBody,
  notesPath,
  packageName,
  recordsPath,
  repository,
  verifyArchive,
  type Candidate,
  type Records,
} from './model';
import { command, json, output, summary } from './io';
import { completeRelease } from './sequence';

assert.equal(
  process.env.GITHUB_ACTIONS,
  'true',
  'Publication is restricted to GitHub Actions',
);
assert.equal(
  process.env.GITHUB_REF,
  'refs/heads/main',
  'Publication is restricted to main',
);
assert.equal(
  process.env.GITHUB_REPOSITORY,
  repository,
  'Unexpected publishing repository',
);
assert(process.env.RELEASE_TOKEN, 'Release bot token is missing');

const api = `https://api.github.com/repos/${repository}`;
async function github(
  path: string,
  method = 'GET',
  body?: unknown,
  allow404 = false,
) {
  return json(
    `${api}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${process.env.RELEASE_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
    allow404,
  );
}

async function content(path: string, ref: string) {
  const file = await github(`/contents/${path}?ref=${ref}`);
  assert(
    file.type === 'file' && file.encoding === 'base64',
    `Cannot read ${path}`,
  );
  return Buffer.from(file.content, 'base64').toString('utf8');
}

async function ensureTag(candidate: Candidate, create = true) {
  const name = `v${candidate.version}`;
  const tag = await github(`/git/ref/tags/${name}`, 'GET', undefined, true);
  if (!tag) {
    if (create) {
      await github('/git/refs', 'POST', {
        ref: `refs/tags/${name}`,
        sha: candidate.commit,
      });
    }
    return;
  }
  let object = tag.object;
  for (let depth = 0; object.type === 'tag' && depth < 5; depth++) {
    object = (await github(`/git/tags/${object.sha}`)).object;
  }
  assert(
    object.type === 'commit' && object.sha === candidate.commit,
    `${name} already points to another commit; never move a release tag`,
  );
}

async function ensureRelease(candidate: Candidate, publishedAt: string) {
  const tag = `v${candidate.version}`;
  const existing = await github(
    `/releases/tags/${tag}`,
    'GET',
    undefined,
    true,
  );
  if (existing) {
    assert(
      !existing.draft && !existing.prerelease,
      'Existing GitHub release is not a published stable release',
    );
    return;
  }
  const notes = finalizeNotes(
    await content(notesPath, candidate.commit),
    candidate.version,
    publishedAt,
  );
  await github('/releases', 'POST', {
    tag_name: tag,
    target_commitish: candidate.commit,
    name: tag,
    body: githubReleaseBody(notes, candidate.version),
    draft: false,
    prerelease: false,
    make_latest: 'legacy',
  });
}

async function record(
  candidate: Candidate,
  integrity: string,
  publishedAt: string,
) {
  // Main can advance during a release. Reapply only metadata to its current tree,
  // and use a non-forced ref update so concurrent contributor changes survive.
  for (let attempt = 0; attempt < 5; attempt++) {
    const head = (await github('/git/ref/heads/main')).object.sha;
    const previous = await github(`/git/commits/${head}`);
    const records: Records = JSON.parse(await content(recordsPath, head));
    const entry = { commit: candidate.commit, integrity, publishedAt };
    if (records[candidate.version])
      assert.deepEqual(records[candidate.version], entry);
    records[candidate.version] = entry;
    const notes = finalizeNotes(
      await content(notesPath, head),
      candidate.version,
      publishedAt,
    );
    const files = [
      {
        path: notesPath,
        content: await format(notes, {
          ...(await resolveConfig(notesPath)),
          filepath: notesPath,
        }),
      },
      {
        path: recordsPath,
        content: await format(JSON.stringify(records), {
          ...(await resolveConfig(recordsPath)),
          filepath: recordsPath,
        }),
      },
    ];
    const tree = await github('/git/trees', 'POST', {
      base_tree: previous.tree.sha,
      tree: files.map((file) => ({ ...file, mode: '100644', type: 'blob' })),
    });
    const commit = await github('/git/commits', 'POST', {
      message: `docs: record npm publication of ${candidate.version} [skip ci]`,
      tree: tree.sha,
      parents: [head],
    });
    try {
      await github('/git/refs/heads/main', 'PATCH', {
        sha: commit.sha,
        force: false,
      });
      return commit.sha;
    } catch (error) {
      const latest = (await github('/git/ref/heads/main')).object.sha;
      if (latest === head || attempt === 4) throw error;
    }
  }
  throw new Error('Main kept changing while recording the release');
}

const plan: Candidate[] = await Bun.file('.release/plan.json').json();
let docsCommit: string | undefined;
for (const candidate of plan) {
  const archive = resolve(
    `.release/artifacts/release-${candidate.version}/package.tgz`,
  );
  const manifest = await Bun.file(
    `.release/artifacts/release-${candidate.version}/archive.json`,
  ).json();
  const hash = await verifyArchive(
    new Uint8Array(await Bun.file(archive).arrayBuffer()),
    candidate,
  );
  assert.equal(manifest.integrity, hash, 'Downloaded archive checksum differs');
  assert.equal(manifest.commit, candidate.commit);
  let publicationAttempted = false;
  try {
    // Detect a conflicting tag before the irreversible npm publication.
    await ensureTag(candidate, false);
    await completeRelease(candidate, hash, {
      read: async () => {
        let data: any;
        for (
          let attempt = 0;
          attempt < (publicationAttempted ? 12 : 1);
          attempt++
        ) {
          data = await json(`https://registry.npmjs.org/${packageName}`);
          if (data.versions[candidate.version] || !publicationAttempted) break;
          if (attempt < 11) await Bun.sleep(5000);
        }
        return {
          metadata: data.versions[candidate.version],
          publishedAt: data.time[candidate.version],
          latest: data['dist-tags'].latest,
        };
      },
      publish: async () => {
        publicationAttempted = true;
        await summary(
          `Publishing ${candidate.version} from ${candidate.commit}. Tested archive: ${hash}`,
        );
        console.log(
          await command(
            [
              'npm',
              'publish',
              archive,
              '--provenance',
              '--ignore-scripts',
              '--access',
              'public',
              '--tag',
              'latest',
              '--registry=https://registry.npmjs.org/',
            ],
            process.cwd(),
            {
              ...process.env,
              // npm's provenance generator reads this value for its source
              // dependency. Recovery can build an older main commit in this run.
              GITHUB_SHA: candidate.commit,
              RELEASE_TOKEN: '',
            },
          ),
        );
      },
      tag: () => ensureTag(candidate),
      release: (date) => ensureRelease(candidate, date),
      record: async (date) => {
        docsCommit = await record(candidate, hash, date);
      },
    });
    await summary(
      `Confirmed npm publication, GitHub release and documentation source for ${candidate.version}.`,
    );
  } catch (error) {
    await summary(
      `Release ${candidate.version} stopped: ${error instanceof Error ? error.message : String(error)}. npm may already contain this version. Fix the reported problem, then rerun Publish Package on main. The workflow verifies npm identity before resuming and never moves existing tags.`,
    );
    throw error;
  }
}
await output(
  'docs_commit',
  docsCommit || (await github('/git/ref/heads/main')).object.sha,
);
