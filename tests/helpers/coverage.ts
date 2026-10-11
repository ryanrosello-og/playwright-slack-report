import path from 'node:path';

export function coveragePreload(): string[] {
  return process.env.SLACK_REPORT_COVERAGE_DIR
    ? ['--preload', path.resolve('scripts/coverage-preload.ts')]
    : [];
}
