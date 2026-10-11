import { plugin } from 'bun';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { instrument } from './coverage-transform';

const root = path.resolve(import.meta.dir, '..');
const source = path.join(root, 'src') + path.sep;
const sourceFilter = new RegExp(
  `^${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\.ts$`,
);
const directory = process.env.SLACK_REPORT_COVERAGE_DIR;
export function flushCoverage() {
  if (!directory) return;
  const coverage = (process as any).__slackReportCoverage || {};
  writeFileSync(
    path.join(directory, `${process.pid}.json`),
    JSON.stringify(coverage),
  );
}
if (directory) {
  plugin({
    name: 'source-coverage',
    setup(builder) {
      builder.onLoad({ filter: sourceFilter }, (args) => {
        return { contents: instrument(args.path).code, loader: 'ts' };
      });
    },
  });
  process.on('exit', flushCoverage);
}
