import { readFileSync } from 'node:fs';
import { createInstrumenter } from 'istanbul-lib-instrument';

// Instrument TypeScript directly: counters and locations describe source logic,
// not the JavaScript helpers introduced by a compiler.
export function instrument(filename: string) {
  const instrumenter = createInstrumenter({
    esModules: true,
    coverageGlobalScope: 'process',
    coverageGlobalScopeFunc: false,
    coverageVariable: '__slackReportCoverage',
    parserPlugins: ['typescript'],
    produceSourceMap: true,
  });
  const code = instrumenter.instrumentSync(
    readFileSync(filename, 'utf8'),
    filename,
  );
  return { code, coverage: instrumenter.lastFileCoverage() };
}
