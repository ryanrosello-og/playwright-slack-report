import { afterAll, afterEach, beforeEach, setDefaultTimeout } from 'bun:test';
import sinon from 'ts-sinon';
import { flushCoverage } from '../scripts/coverage-preload';

setDefaultTimeout(30000);

// Bun's test runner finishes via its own shutdown path; CLI children use exit.
afterAll(flushCoverage);

const keys = ['SLACK_BOT_USER_OAUTH_TOKEN', 'SLACK_WEBHOOK_URL'];
let environment: Record<string, string | undefined>;
beforeEach(() => {
  environment = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
});
afterEach(() => {
  sinon.restore();
  for (const key of keys) {
    if (environment[key] === undefined) delete process.env[key];
    else process.env[key] = environment[key];
  }
});
