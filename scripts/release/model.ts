import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

export const packageName = 'playwright-slack-report';
export const repository = 'ryanrosello-og/playwright-slack-report';
export const notesPath = 'website/docs/release-notes.md';
export const recordsPath = '.github/release-records.json';
export const configPath = '.github/release-config.json';

export type Candidate = { version: string; commit: string; base: string };
export type Record = {
  commit: string;
  integrity: string;
  publishedAt: string;
};
export type Records = { [version: string]: Record };

export function stable(version: string): number[] {
  assert(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version),
    `Only stable versions are supported: ${version}`,
  );
  const numbers = version.split('.').map(Number);
  assert(
    numbers.every(Number.isSafeInteger),
    'Version components are too large',
  );
  return numbers;
}

export function compare(a: string, b: string): number {
  const left = stable(a);
  const right = stable(b);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

// A version's first main commit is immutable. Later runs recover the same
// candidate instead of accidentally publishing unrelated changes after a failure.
export function candidates(
  history: Candidate[],
  records: Records,
): Candidate[] {
  const releases: Candidate[] = [];
  let previous: Candidate | undefined;
  for (const item of history) {
    stable(item.version);
    assert(/^[a-f0-9]{40}$/.test(item.commit), 'Invalid release commit');
    if (previous?.version === item.version) continue;
    if (previous)
      assert(
        compare(item.version, previous.version) > 0,
        'Versions on main must increase; reverting a published version is unsafe',
      );
    const recorded = records[item.version];
    if (recorded)
      assert.equal(
        recorded.commit,
        item.commit,
        `Recorded source differs for ${item.version}`,
      );
    else releases.push(item);
    previous = item;
  }
  return releases;
}

export function releaseSection(notes: string, version: string) {
  stable(version);
  const sections = notes.replace(/\r\n/g, '\n').split(/(?=^## )/m);
  const matches = sections.filter((s) => s.startsWith(`## ${version} - `));
  assert.equal(
    matches.length,
    1,
    `Provide exactly one release-note section for ${version}`,
  );
  return matches[0];
}

export function validateVersion(
  manifest: { name: string; version: string },
  cli: string,
  notes: string,
) {
  assert.equal(manifest.name, packageName);
  stable(manifest.version);
  const versions = [...cli.matchAll(/\.version\(['"]([^'"]+)['"]\)/g)];
  assert.equal(versions.length, 1, 'Expected one CLI version');
  assert.equal(
    versions[0][1],
    manifest.version,
    'CLI and package versions differ',
  );
  const section = releaseSection(notes, manifest.version);
  assert(
    section.startsWith(`## ${manifest.version} - Unreleased`),
    'Release candidates must have an Unreleased version section',
  );
  assert(
    /^### (Added|Changed|Fixed|Upgrade instructions)$/m.test(section),
    'Release notes must describe the package changes',
  );
}

export function integrity(bytes: Uint8Array): string {
  return `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
}

export async function verifyArchive(bytes: Uint8Array, candidate: Candidate) {
  const files = await new Bun.Archive(bytes).files();
  const entry = files.get('package/package.json');
  assert(entry, 'Archive has no package manifest');
  const manifest = JSON.parse(await entry.text());
  assert.equal(manifest.name, packageName);
  assert.equal(manifest.version, candidate.version);
  assert.equal(
    manifest.gitHead,
    candidate.commit,
    'Archive source identity differs',
  );
  return integrity(bytes);
}

export function verifyPublished(
  metadata: any,
  candidate: Candidate,
  expectedIntegrity?: string,
) {
  assert.equal(metadata.name, packageName);
  assert.equal(metadata.version, candidate.version);
  assert.equal(
    metadata.gitHead,
    candidate.commit,
    `npm version ${candidate.version} belongs to a different commit; stop for investigation`,
  );
  assert(
    /^sha512-[A-Za-z0-9+/]+=*$/.test(metadata.dist?.integrity),
    'npm integrity is missing',
  );
  if (expectedIntegrity)
    assert.equal(
      metadata.dist.integrity,
      expectedIntegrity,
      'npm archive differs from the tested archive',
    );
}

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function finalizeNotes(
  notes: string,
  version: string,
  publishedAt: string,
  now = new Date(),
) {
  const published = new Date(publishedAt);
  assert(!Number.isNaN(published.valueOf()), 'Invalid npm publication date');
  assert(published <= now, 'Publication date is in the future');
  const section = releaseSection(notes, version);
  const heading = section.split('\n')[0];
  const suffix = heading.match(/ (\{#[^}]+\})$/)?.[0] || '';
  const expected = `## ${version} - ${dateLabel(published)}${suffix}`;
  assert(
    heading === `## ${version} - Unreleased${suffix}` || heading === expected,
    'Existing release date disagrees with npm',
  );
  const link = `https://github.com/${repository}/releases/tag/v${version}`;
  let updated = section
    .replace(heading, expected)
    .replace(
      `Version ${version} is prepared for release. It is not yet published.\n\n`,
      '',
    );
  if (!updated.includes(link))
    updated = `${updated.trimEnd()}\n\n[GitHub release](${link})\n\n`;
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()),
  );
  const result = notes
    .replace(/\r\n/g, '\n')
    .replace(section, updated)
    .split(/(?=^## )/m)
    .filter((part) => {
      const date = part.match(/^## \d+\.\d+\.\d+ - (\d{1,2} [A-Za-z]+ \d{4})/);
      return !date || new Date(`${date[1]} UTC`) >= cutoff;
    })
    .join('');
  return result.replace(
    /from \*\*[^*]+\*\*/,
    `from **${dateLabel(cutoff)} to ${dateLabel(now)}**`,
  );
}

export function githubReleaseBody(notes: string, version: string) {
  return releaseSection(notes, version)
    .split('\n')
    .slice(1)
    .join('\n')
    .trim()
    .replace(
      /\]\(\.\/([\w-]+)\.md([^)]*)\)/g,
      `](https://ryanrosello-og.github.io/playwright-slack-report/docs/$1/$2)`,
    );
}
