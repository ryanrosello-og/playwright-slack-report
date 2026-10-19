import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  packageName,
  notesPath,
  validateVersion,
  verifyArchive,
  verifyPublished,
  type Candidate,
} from './model';
import { command, json } from './io';

const manifestText = await Bun.file('package.json').text();
const manifest = JSON.parse(manifestText);
validateVersion(
  manifest,
  await Bun.file('cli.ts').text(),
  await Bun.file(notesPath).text(),
);
const candidate: Candidate = {
  version: manifest.version,
  commit: await command(['git', 'rev-parse', 'HEAD']),
  base: '',
};
await mkdir('.release', { recursive: true });
const target = resolve('.release/package.tgz');
const metadata = await json(
  `https://registry.npmjs.org/${packageName}/${candidate.version}`,
  {},
  true,
);
if (metadata) {
  // A failed post-publication step must test and reuse the original npm archive.
  verifyPublished(metadata, candidate);
  const url = new URL(metadata.dist.tarball);
  assert.equal(url.origin, 'https://registry.npmjs.org');
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  assert(response.ok, `Cannot download published archive: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.equal(await verifyArchive(bytes, candidate), metadata.dist.integrity);
  await Bun.write(target, bytes);
} else {
  // Embed the immutable source identity in the archive and npm metadata.
  // Restore the checkout even if packing fails.
  try {
    await Bun.write(
      'package.json',
      `${JSON.stringify({ ...manifest, gitHead: candidate.commit }, null, 2)}\n`,
    );
    console.log(
      await command([process.execPath, 'pm', 'pack', '--filename', target]),
    );
  } finally {
    await Bun.write('package.json', manifestText);
  }
}
const integrity = await verifyArchive(
  new Uint8Array(await Bun.file(target).arrayBuffer()),
  candidate,
);
await Bun.write(
  '.release/archive.json',
  JSON.stringify({ ...candidate, integrity }, null, 2),
);
console.log(
  `Prepared ${candidate.version} from ${candidate.commit}: ${integrity}`,
);
