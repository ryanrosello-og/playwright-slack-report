import { expect, test } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import sinon from 'ts-sinon';
import doPreChecks from '../src/cli/cli_pre_checks';

test('invalid path inputs return a diagnostic instead of throwing', async () => {
  const log = sinon.stub(console, 'error');
  try {
    const result = await doPreChecks(undefined as any, 'config.json');
    expect(result.status).toBe('error');
    expect(result.message).toContain('JSON results file does not exist');
    expect(log.calledOnce).toBe(true);
    expect(log.firstCall.args[0]).toBe('Error resolving path: undefined');
  } finally {
    log.restore();
  }
});

test('webhook configuration returns resolved paths and schema defaults', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'slack-config-'));
  try {
    const results = path.join(directory, 'results.json');
    const config = path.join(directory, 'config.json');
    writeFileSync(results, '{}');
    writeFileSync(config, JSON.stringify({ sendResults: 'always', slackLogLevel: 'error',
      sendUsingWebhook: { webhookUrl: 'https://example.invalid/webhook' } }));
    const result = await doPreChecks(results, config);
    expect(result).toMatchObject({ status: 'ok', jsonPath: results, configPath: config,
      config: { sendUsingWebhook: { webhookUrl: 'https://example.invalid/webhook' },
        maxNumberOfFailures: 5, disableUnfurl: false, showInThread: false },
    });
    writeFileSync(config, '{broken json');
    const invalid = await doPreChecks(results, config);
    expect(invalid.status).toBe('error');
    expect(invalid.message).toContain('Config file is not valid:');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
