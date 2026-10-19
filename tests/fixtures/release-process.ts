// Run only in an isolated process. Every external request and npm invocation
// fails closed unless explicitly handled below; no real publication is possible.
import assert from 'node:assert/strict';
import {
  packageName,
  repository,
  notesPath,
  recordsPath,
  integrity,
} from '../../scripts/release/model';

const candidate = {
  version: '1.1.118',
  commit: 'a'.repeat(40),
  base: '0'.repeat(40),
};
const scenario = process.env.RELEASE_TEST_SCENARIO;
const publishedAt = new Date().toISOString();
const notes = `These notes cover changes from **18 October 2025 to 18 October 2026**.\n\n## 1.1.118 - Unreleased {#v11118}\n\nVersion 1.1.118 is prepared for release. It is not yet published.\n\n### Added\n\n- Artifacts.\n`;
const bytes = await new Bun.Archive({
  'package/package.json': JSON.stringify({
    name: packageName,
    version: candidate.version,
    gitHead: candidate.commit,
  }),
}).bytes();
const hash = integrity(bytes);
await Bun.write('.release/plan.json', JSON.stringify([candidate]));
await Bun.write('.release/artifacts/release-1.1.118/package.tgz', bytes);
await Bun.write(
  '.release/artifacts/release-1.1.118/archive.json',
  JSON.stringify({ ...candidate, integrity: hash }),
);

const calls: string[] = [];
let published = scenario === 'recover';
let main = 'b'.repeat(40);
let tag =
  scenario === 'tag-conflict'
    ? 'd'.repeat(40)
    : scenario === 'recover'
      ? candidate.commit
      : undefined;
let release = scenario === 'recover';
let mainNotes = notes;
let tree: any;
let proposedTree: any;
let race = scenario === 'main-race';
const realSpawn = Bun.spawn;
(Bun as any).spawn = (args: string[], options: any) => {
  assert.equal(args[0], 'npm', `Unexpected subprocess: ${args}`);
  assert.equal(args[1], 'publish');
  assert(args.includes('--ignore-scripts'));
  assert.equal(options.env.GITHUB_SHA, candidate.commit);
  assert.equal(options.env.RELEASE_TOKEN, '');
  calls.push('npm');
  published = true;
  return { stdout: new Response('published').body, exited: Promise.resolve(0) };
};
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
globalThis.fetch = (async (input: string, init: RequestInit = {}) => {
  const url = new URL(input);
  const method = init.method || 'GET';
  const body = init.body ? JSON.parse(String(init.body)) : undefined;
  if (url.origin === 'https://registry.npmjs.org') {
    assert.equal(url.pathname, `/${packageName}`);
    if (scenario === 'registry-outage') return response({}, 503);
    return response({
      versions: published
        ? {
            '1.1.118': {
              name: packageName,
              version: '1.1.118',
              gitHead: candidate.commit,
              dist: { integrity: hash },
            },
          }
        : {},
      time: published ? { '1.1.118': publishedAt } : {},
      'dist-tags': { latest: published ? '1.1.118' : '1.1.117' },
    });
  }
  assert.equal(
    url.origin,
    'https://api.github.com',
    'Unexpected network request',
  );
  const route = url.pathname.replace(`/repos/${repository}`, '');
  if (route === '/git/ref/tags/v1.1.118')
    return tag
      ? response({ object: { type: 'commit', sha: tag } })
      : response({}, 404);
  if (route === '/git/refs' && method === 'POST') {
    assert(published);
    assert.equal(body.sha, candidate.commit);
    tag = body.sha;
    calls.push('tag');
    return response({});
  }
  if (route === '/releases/tags/v1.1.118')
    return release
      ? response({ draft: false, prerelease: false })
      : response({}, 404);
  if (route === '/releases' && method === 'POST') {
    assert(published);
    calls.push('release');
    release = true;
    return response({});
  }
  if (route === '/git/ref/heads/main')
    return response({ object: { sha: main } });
  if (route.startsWith('/git/commits/') && method === 'GET')
    return response({ tree: { sha: 'tree' } });
  if (route.startsWith('/contents/')) {
    const file = route.slice('/contents/'.length);
    assert([notesPath, recordsPath].includes(file));
    const value =
      file === recordsPath
        ? '{}'
        : url.searchParams.get('ref') === candidate.commit
          ? notes
          : mainNotes;
    return response({
      type: 'file',
      encoding: 'base64',
      content: Buffer.from(value).toString('base64'),
    });
  }
  if (route === '/git/trees' && method === 'POST') {
    expectPaths(body.tree);
    proposedTree = body.tree;
    return response({ sha: 'new-tree' });
  }
  if (route === '/git/commits' && method === 'POST')
    return response({ sha: 'e'.repeat(40) });
  if (route === '/git/refs/heads/main' && method === 'PATCH') {
    assert.equal(body.force, false);
    if (race) {
      race = false;
      main = 'c'.repeat(40);
      mainNotes = mainNotes.replace(
        '## 1.1.118',
        '## 1.1.119 - Unreleased\n\n### Added\n\n- Concurrent change.\n\n## 1.1.118',
      );
      return response({}, 422);
    }
    tree = proposedTree;
    main = body.sha;
    calls.push('record');
    return response({});
  }
  throw new Error(`Unhandled request ${method} ${route}`);
}) as unknown as typeof fetch;

function expectPaths(entries: any[]) {
  assert.deepEqual(
    entries.map((entry) => entry.path).sort(),
    [notesPath, recordsPath].sort(),
  );
}

let error = '';
try {
  await import('../../scripts/release/publish');
} catch (failure) {
  error = String(failure);
} finally {
  Bun.spawn = realSpawn;
}
await Bun.write(
  'result.json',
  JSON.stringify({ calls, error, tree, publishedAt }),
);
