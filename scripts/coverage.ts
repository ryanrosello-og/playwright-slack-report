import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCoverageMap } from 'istanbul-lib-coverage';
import { createContext } from 'istanbul-lib-report';
import { create } from 'istanbul-reports';
import { instrument } from './coverage-transform';

const root = path.resolve(import.meta.dir, '..');
const output = path.join(root, 'coverage');
const raw = path.join(output, 'raw');
await rm(output, { recursive: true, force: true });
await mkdir(raw, { recursive: true });
const coverage = createCoverageMap({});
for (const file of new Bun.Glob('src/**/*.ts').scanSync(root)) {
  coverage.addFileCoverage(instrument(path.join(root, file)).coverage);
}
const child = Bun.spawn(
  [
    process.execPath,
    'test',
    ...(process.env.CI ? ['--forbid-only'] : []),
    '--preload',
    path.join(root, 'scripts/coverage-preload.ts'),
    ...process.argv.slice(2),
  ],
  {
    cwd: root,
    env: { ...process.env, SLACK_REPORT_COVERAGE_DIR: raw },
    stdout: 'inherit',
    stderr: 'inherit',
  },
);
const exitCode = await child.exited;
for (const filename of await readdir(raw)) {
  coverage.merge(JSON.parse(await readFile(path.join(raw, filename), 'utf8')));
}
const context = createContext({ dir: output, coverageMap: coverage });
for (const format of [
  'text',
  'text-summary',
  'lcovonly',
  'json-summary',
  'json',
]) {
  create(format).execute(context);
}
await writeFile(
  path.join(output, 'runtime.json'),
  JSON.stringify({ bun: Bun.version, processes: (await readdir(raw)).length }),
);
const thresholds = await Bun.file(
  path.join(root, 'coverage-thresholds.json'),
).json();
const summary = coverage.getCoverageSummary().toJSON();
let belowThreshold = false;
for (const [metric, minimum] of Object.entries(thresholds)) {
  if (summary[metric].pct < Number(minimum)) {
    console.error(
      `${metric} coverage ${summary[metric].pct}% is below ${minimum}%`,
    );
    belowThreshold = true;
  }
}
process.exitCode = exitCode || (belowThreshold ? 1 : 0);
