import { coveragePreload } from './helpers/coverage';
import { describe, expect, test } from 'bun:test';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const root = path.resolve(__dirname, '..');
const proxy = 'http://proxy.example.com:8080';

test('installed undici honors a real loopback proxy under Bun', async () => {
  await execute(process.execPath, [path.join(__dirname, 'helpers/proxy-transport.mjs')], {
    cwd: root, timeout: 10000,
  });
}, 15000);

async function runScenario(scenario: {
  entryPoint: 'cli' | 'reporter';
  transport: 'bot' | 'webhook';
  proxy?: string;
  sendResults?: string;
  empty?: boolean;
}) {
  const directory = await mkdtemp(path.join(tmpdir(), 'slack-proxy-unit-'));
  try {
    const configPath = path.join(directory, 'config.json');
    const resultsPath = path.join(directory, 'results.json');
    await writeFile(configPath, JSON.stringify({
      sendResults: scenario.sendResults || 'always', slackLogLevel: 'error',
      proxy: scenario.proxy, meta: [],
      ...(scenario.transport === 'bot' ? { sendUsingBot: { channels: ['unit-channel'] } }
        : { sendUsingWebhook: { webhookUrl: 'https://example.invalid/unit-webhook' } }),
    }));
    await writeFile(resultsPath, '{}');
    const env: NodeJS.ProcessEnv = { ...process.env, PROXY_UNIT_SCENARIO: JSON.stringify({ ...scenario, configPath, resultsPath }) };
    delete env.SLACK_BOT_USER_OAUTH_TOKEN;
    delete env.SLACK_WEBHOOK_URL;
    const { stdout } = await execute(process.execPath, [...coveragePreload(), path.join(__dirname, 'helpers/proxy-scenario.mjs')], {
      cwd: root, env, timeout: 10000,
    });
    const line = stdout.split(/\r?\n/).find(value => value.startsWith('PROXY_UNIT_RESULT='));
    expect(line, 'Entry point did not finish').toBeDefined();
    return JSON.parse(line!.slice('PROXY_UNIT_RESULT='.length));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

for (const entryPoint of ['cli', 'reporter'] as const) {
  describe(`${entryPoint} proxy configuration`, () => {
    for (const transport of ['bot', 'webhook'] as const) {
      test(`${transport}: does not load undici or replace global fetch without proxy`, async () => {
        const result = await runScenario({ entryPoint, transport });
        expect(result.loadsAfterImport).toBe(0);
        expect(result.undiciLoads).toBe(0);
        expect(result.globalFetchPreserved).toBe(true);
        expect(result.proxyAgents).toEqual([]);
        expect(result.httpsAgents).toEqual([]);
        if (transport === 'bot') {
          expect(result.clients).toEqual([{ token: 'unit-test-token', hasFetch: false }]);
          expect(result.posts).toBe(1);
        } else {
          expect(result.webhooks).toEqual([expect.objectContaining({ hasFetch: false, hasAgent: false })]);
          expect(result.sends).toBe(1);
        }
      });

      test(`${transport}: lazily loads undici and wires the configured proxy`, async () => {
        const result = await runScenario({ entryPoint, transport, proxy });
        expect(result.loadsAfterImport).toBe(0);
        expect(result.undiciLoads).toBe(1);
        expect(result.httpsAgents).toEqual([]);
        if (transport === 'bot') {
          expect(result.clients).toEqual([{ token: 'unit-test-token', hasFetch: true }]);
          expect(result.proxyAgents).toEqual([proxy]);
          expect(result.fetchCalls).toEqual([{ url: 'https://slack.com/api/chat.postMessage', dispatcherUrl: proxy }]);
          expect(result.requestInitPreserved).toBe(true);
          expect(result.fetchResponsePreserved).toBe(true);
          expect(result.posts).toBe(1);
        } else {
          // @slack/webhook v8 uses the same fetch/dispatcher adapter as bots.
          expect(result.webhooks).toEqual([expect.objectContaining({ hasFetch: true, hasAgent: false })]);
          expect(result.proxyAgents).toEqual([proxy]);
          expect(result.fetchCalls).toEqual([{ url: 'https://example.invalid/unit-webhook', dispatcherUrl: proxy }]);
          expect(result.requestInitPreserved).toBe(true);
          expect(result.fetchResponsePreserved).toBe(true);
          expect(result.sends).toBe(1);
        }
      });
    }
  });
}

for (const skip of [
  { name: 'reporting disabled', sendResults: 'off' },
  { name: 'no failures in on-failure mode', sendResults: 'on-failure' },
  { name: 'empty test suite', empty: true },
]) {
  test(`reporter: does not load proxy dependencies when ${skip.name}`, async () => {
    const result = await runScenario({ entryPoint: 'reporter', transport: 'bot', proxy, ...skip });
    expect(result.undiciLoads).toBe(0);
    expect(result.globalFetchPreserved).toBe(true);
    expect(result.clients).toEqual([]);
    expect(result.httpsAgents).toEqual([]);
    expect(result.posts).toBe(0);
  });
}
