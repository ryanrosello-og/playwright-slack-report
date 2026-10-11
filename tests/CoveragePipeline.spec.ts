import { expect, test } from 'bun:test';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createCoverageMap } from 'istanbul-lib-coverage';
import { instrument } from '../scripts/coverage-transform';

test('coverage preserves an unexecuted file and merges separate child branch executions', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'bun-coverage-test-'));
  try {
    const source = path.join(directory, 'branch.ts');
    await writeFile(
      source,
      'export function branch(value: boolean) { if (value) return 1; return 2; }',
    );
    const initial = instrument(source);
    const coverage = createCoverageMap({});
    coverage.addFileCoverage(initial.coverage);
    expect(coverage.getCoverageSummary().statements.pct).toBe(0);
    expect(coverage.getCoverageSummary().branches.total).toBe(2);
    const entry = path.join(directory, 'instrumented.ts');
    await writeFile(
      entry,
      `${initial.code}\nbranch(process.argv[2] === 'true');`,
    );
    const raw = path.join(directory, 'raw');
    await Bun.write(path.join(raw, '.keep'), '');
    for (const argument of ['true', 'false']) {
      const child = Bun.spawn(
        [
          process.execPath,
          '--preload',
          path.resolve('scripts/coverage-preload.ts'),
          entry,
          argument,
        ],
        {
          env: { ...process.env, SLACK_REPORT_COVERAGE_DIR: raw },
          stdout: 'pipe',
          stderr: 'pipe',
        },
      );
      expect(await child.exited).toBe(0);
    }
    const reports = (await readdir(raw)).filter((file) =>
      file.endsWith('.json'),
    );
    expect(reports).toHaveLength(2);
    for (const report of reports)
      coverage.merge(
        JSON.parse(await readFile(path.join(raw, report), 'utf8')),
      );
    const summary = coverage.getCoverageSummary();
    for (const metric of ['statements', 'branches', 'functions', 'lines'])
      expect(summary[metric].pct).toBe(100);
    // A file never loaded by either child must still appear with zero hits.
    const untouched = path.join(directory, 'untouched.ts');
    await writeFile(untouched, 'export const untouched = () => 42;');
    coverage.addFileCoverage(instrument(untouched).coverage);
    expect(coverage.fileCoverageFor(untouched).toSummary().statements.pct).toBe(
      0,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
