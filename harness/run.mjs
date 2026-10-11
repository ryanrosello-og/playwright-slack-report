import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { startProxy } from './proxy.mjs';

const harness = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(harness);
const bun = process.execPath;
// bun run puts a Node-compatible Bun shim first on PATH. Skip it deliberately
// so the installed-package checks actually exercise the consumer's Node runtime.
const node = process.env.HARNESS_NODE || (process.env.PATH || '').split(path.delimiter)
  .map(directory => Bun.which('node', { PATH: directory }))
  .find(candidate => candidate && Bun.spawnSync([candidate, '-e', 'process.exit(process.versions.bun ? 1 : 0)']).exitCode === 0);
assert(node, 'Install Node 24+ for the consumer compatibility checks');
const offline = process.argv.includes('--offline');
assert(process.argv.slice(2).every(arg => arg === '--offline'), 'Only --offline is supported');
if (existsSync(path.join(harness, '.env'))) process.loadEnvFile(path.join(harness, '.env'));
const token = process.env.SLACK_BOT_USER_OAUTH_TOKEN;
const webhook = process.env.SLACK_WEBHOOK_URL;
const channelName = process.env.SLACK_CHANNEL || 'pw';
const webhookChannelName = process.env.SLACK_WEBHOOK_CHANNEL || 'webhook';
const runId = `harness-${randomUUID()}`;
const artifacts = path.join(harness, 'artifacts', runId);
await mkdir(artifacts, { recursive: true });
const report = { runId, mode: offline ? 'offline' : 'live', paths: [], errors: [], cleanup: [] };
const secrets = [token, webhook].filter(Boolean);
function redact(value) {
  let text = String(value);
  for (const secret of secrets) text = text.split(secret).join('[REDACTED]');
  return text.replace(/xox[baprs]-[A-Za-z0-9-]+/g, '[REDACTED]')
    .replace(/https:\/\/hooks\.slack\.com\/services\/[^\s"'\\]+/g, '[REDACTED]');
}
async function save(name, value) {
  await writeFile(path.join(artifacts, name), redact(typeof value === 'string' ? value : JSON.stringify(value, null, 2)));
}
function baseEnv() {
  const env = { ...process.env, NODE_PATH: '' };
  delete env.SLACK_BOT_USER_OAUTH_TOKEN;
  delete env.SLACK_WEBHOOK_URL;
  delete env.HARNESS_PROXY;
  return env;
}
// Execute commands directly with argument arrays to avoid shell interpretation.
async function command(name, args, cwd, label, env = baseEnv(), expectedCode = 0) {
  console.log(`[harness] ${label}`);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(name, args, { cwd, env, windowsHide: true, timeout: 600000 });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({ code, signal, output }));
  });
  await save(`${label}.log`, result.output);
  assert.equal(result.code, expectedCode,
    `${label} exited ${result.code} (${result.signal || 'no signal'}); see ${label}.log\n${redact(result.output.slice(-2000))}`);
  return result.output;
}

async function slack(method, params = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const read = method === 'auth.test' || method.startsWith('conversations.');
    const url = `https://slack.com/api/${method}${read ? `?${new URLSearchParams(params)}` : ''}`;
    const response = await fetch(url, {
      method: read ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${token}`, ...(read ? {} : { 'Content-Type': 'application/json; charset=utf-8' }) },
      ...(read ? {} : { body: JSON.stringify(params) }),
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 429 && attempt < 3) {
      const seconds = Number(response.headers.get('retry-after') || 1);
      assert(seconds <= 60, `Slack rate limit requires ${seconds}s; retry the harness later`);
      await delay(seconds * 1000);
      continue;
    }
    const result = await response.json();
    assert(response.ok && result.ok,
      `${method}: ${result.error || response.status}${result.needed ? ` (needed: ${result.needed})` : ''}`);
    return result;
  }
}

async function pages(method, params, key) {
  const items = [];
  let cursor;
  do {
    const result = await slack(method, { ...params, limit: 100, ...(cursor ? { cursor } : {}) });
    items.push(...(result[key] || []));
    cursor = result.response_metadata?.next_cursor;
    assert(!result.has_more || cursor, `${method}: more results without a pagination cursor`);
  } while (cursor);
  return items;
}

let channel;
let botChannel;
let webhookChannel;
let botUser;
let botId;
let started;
let consumer;
let proxy;
const markers = new Set();
const markerChannels = new Map();
const webhookMarkers = new Set();
const knownParents = new Map();
const expectedStats = { expected: 1, unexpected: 3, flaky: 1, skipped: 2 };
const failures = ['permanent failure', 'unexpected pass', 'serial failure'];
function fromConfiguredBot(message) {
  return message.user === botUser || (botId && message.bot_id === botId);
}
function messageText(message) {
  const text = (message.blocks || []).flatMap(block => [block.text?.text || '', ...(block.fields || []).map(field => field.text)]).join('\n');
  // Slack converts Unicode emoji into shortcode names when returning messages.
  const emoji = { white_check_mark: '✅', x: '❌', large_yellow_circle: '🟡', fast_forward: '⏩' };
  return text.replace(/:(white_check_mark|x|large_yellow_circle|fast_forward):/g, (_, name) => emoji[name]);
}
async function parents(channelId = channel) {
  const messages = await pages('conversations.history', { channel: channelId, oldest: started, inclusive: true }, 'messages');
  return messages.filter(message => [...markers].some(marker => messageText(message).includes(marker)));
}
function verifyMessage(parent, replies, threaded, marker) {
  if (threaded) {
    assert(fromConfiguredBot(parent), 'Message was not sent by the configured Slack app');
  } else {
    const integrationId = new URL(webhook).pathname.split('/')[3];
    assert(fromConfiguredBot(parent) || parent.bot_id === integrationId,
      'Message was not sent by the configured webhook integration');
  }
  const text = messageText(parent);
  assert(text.includes(marker), 'Report missing run identifier');
  assert(text.includes('Playwright Results'), 'Report missing header');
  assert.match(text, /✅\s*\*1\*\s*\|\s*❌\s*\*3\*\s*\|\s*🟡\s*\*1\*\s*\|\s*⏩\s*\*2\*/, 'Incorrect Slack totals');
  const details = threaded ? replies.map(messageText).join('\n') : text;
  if (threaded) {
    assert(replies.length > 0, 'Missing failure thread');
    for (const reply of replies) {
      assert.equal(reply.thread_ts, parent.ts, 'Reply attached to the wrong report');
      assert(fromConfiguredBot(reply), 'Reply sent by a different Slack app');
    }
    assert(!text.includes('permanent failure'), 'Failure details belong in the thread');
  } else {
    assert.equal(parent.reply_count || 0, 0, 'Webhook report should not have a failure thread');
  }
  for (const name of failures) assert(details.includes(name), `Missing failure details: ${name}`);
  assert(details.includes('Deliberate failure'), 'Missing assertion failure reason');
  assert(details.includes('Deliberate serial failure'), 'Missing serial failure reason');
  assert(!details.includes('flaky retry'), 'Recovered flaky test reported as a failure');
}

async function verifySlack(mode, marker, label = mode) {
  const deadline = Date.now() + 45000;
  let lastError;
  do {
    try {
      const matches = (await parents()).filter(message => messageText(message).includes(marker));
      for (const parent of matches) knownParents.set(`${channel}:${parent.ts}`, { ...parent, harnessChannel: channel });
      assert.equal(matches.length, 1, `Expected one ${mode} report, got ${matches.length}`);
      const parent = matches[0];
      const replies = mode.endsWith('bot')
        ? (await pages('conversations.replies', { channel, ts: parent.ts }, 'messages')).filter(message => message.ts !== parent.ts)
        : [];
      await save(`${label}-slack.json`, { parent, replies });
      verifyMessage(parent, replies, mode.endsWith('bot'), marker);
      return { parentTs: parent.ts, replies: replies.length };
    } catch (error) {
      lastError = error;
      if (/missing_scope|not_in_channel|invalid_auth|configured Slack app|configured webhook integration|different Slack app/.test(error.message)) throw error;
      await delay(2000);
    }
  } while (Date.now() < deadline);
  throw lastError;
}

async function verifyPlaywright(jsonPath) {
  const result = JSON.parse(await readFile(jsonPath, 'utf8'));
  await save(`${path.basename(jsonPath)}`, result);
  assert.deepEqual(result.errors, [], 'Unexpected Playwright run errors');
  for (const [key, value] of Object.entries(expectedStats)) assert.equal(result.stats[key], value, `Playwright ${key}`);
  const tests = [];
  function walk(suite) {
    for (const spec of suite.specs || []) for (const test of spec.tests) tests.push({ name: spec.title, ...test });
    for (const nested of suite.suites || []) walk(nested);
  }
  for (const suite of result.suites) walk(suite);
  const outcomes = {
    'passing browser interaction': 'expected', 'permanent failure': 'unexpected',
    'unexpected pass': 'unexpected', 'flaky retry': 'flaky', 'explicit skip': 'skipped',
    'serial failure': 'unexpected', 'serial propagated skip': 'skipped',
  };
  assert.equal(tests.length, Object.keys(outcomes).length, 'Fixture test count');
  for (const [name, outcome] of Object.entries(outcomes)) {
    const test = tests.find(test => test.name === name);
    assert.equal(test?.status, outcome, name);
    if (['permanent failure', 'unexpected pass', 'flaky retry', 'serial failure'].includes(name)) {
      assert.deepEqual(test.results.map(result => result.retry), [0, 1], `${name}: retry attempts`);
    }
  }
}

async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return String(port);
}

// Always test the installed package against real lifecycle failures, with only
// Slack's external transport captured locally in both live and offline mode.
async function verifyRunLevelScenarios(pw, cli) {
  const preload = path.join(consumer, 'capture-slack.cjs');
  const fixtures = [
    { name: 'setup-error', status: 'failed', error: 'Deliberate global setup failure', code: 1 },
    { name: 'teardown-error', status: 'failed', error: 'Deliberate global teardown failure', code: 1 },
    { name: 'timeout', status: 'timedout', error: 'Timed out waiting', code: 1 },
    { name: 'interruption', status: 'interrupted', code: 130 },
    { name: 'no-tests', status: 'failed', error: 'No tests found', code: 1 },
    { name: 'clean', status: 'passed', code: 0 },
  ];
  for (const fixture of fixtures) {
    for (const transport of ['bot', 'webhook']) {
      const label = `run-${fixture.name}-${transport}`;
      const resultsPath = path.join(consumer, `${label}-results.json`);
      const runInfo = path.join(consumer, `${label}-run.json`);
      const capture = path.join(consumer, `${label}-capture.jsonl`);
      const env = {
        ...baseEnv(), HARNESS_MODE: `reporter-${transport}`, HARNESS_RUN_FIXTURE: fixture.name,
        HARNESS_JSON: resultsPath, HARNESS_RUN_INFO: runInfo, HARNESS_CAPTURE: capture, HARNESS_RUN_ID: `${runId}:${label}`,
        ...(transport === 'bot' ? { SLACK_BOT_USER_OAUTH_TOKEN: 'harness-local-token' } : {}),
      };
      const entry = { mode: label, transport: 'local-capture', status: 'failed' };
      report.paths.push(entry);
      try {
        await writeFile(capture, '');
        await command(node, ['-r', preload, pw, 'test', '-c', 'run-errors.config.cjs'], consumer, label, env, fixture.code);
        const fullResult = JSON.parse(await readFile(runInfo, 'utf8'));
        assert.equal(fullResult.status, fixture.status, `${label}: actual Playwright run status`);
        const json = JSON.parse(await readFile(resultsPath, 'utf8'));
        await save(`${label}-results.json`, json);
        await save(`${label}-run.json`, fullResult);
        assert.equal(json.stats.unexpected, 0, `${label}: must exercise zero failed tests`);
        if (fixture.error) assert(JSON.stringify(json.errors).includes(fixture.error), `${label}: missing global error`);
        const verifyCapture = async suffix => {
          const data = (await readFile(capture, 'utf8')).trim();
          const messages = data ? data.split('\n').map(line => JSON.parse(line)) : [];
          await save(`${label}-${suffix}-capture.json`, messages);
          if (fixture.status === 'passed') {
            assert.equal(messages.length, 0, `${label}: successful on-failure run must remain silent`);
            return;
          }
          const parents = messages.filter(message => !message.payload.thread_ts);
          assert.equal(parents.length, 1, `${label}: expected one parent report`);
          const parent = parents[0];
          const labelStatus = fixture.status === 'timedout' ? 'timed out' : fixture.status;
          assert(messageText(parent.payload).includes(`Run status: ${labelStatus}`), `${label}: missing overall status`);
          assert(parent.payload.text.includes(`Run status: ${labelStatus}`), `${label}: missing fallback status`);
          const replies = messages.filter(message => message.payload.thread_ts);
          if (transport === 'bot') {
            assert.equal(parent.payload.channel, 'harness-failures', `${label}: wrong channel`);
            for (const reply of replies) assert.equal(reply.payload.thread_ts, parent.ts, `${label}: wrong thread`);
          } else assert.equal(replies.length, 0, `${label}: webhook must be inline`);
          if (fixture.error) {
            const details = transport === 'bot' ? replies.map(message => messageText(message.payload)).join('\n') : messageText(parent.payload);
            assert(details.includes(fixture.error), `${label}: missing global error detail`);
            if (transport === 'bot') assert(!messageText(parent.payload).includes(fixture.error), `${label}: details belong in thread`);
          }
        };
        await verifyCapture('reporter');
        // Exercise inference from real JSON. Only global timeouts need an
        // explicit status because JSON cannot distinguish them reliably.
        await writeFile(capture, '');
        const configPath = path.join(consumer, `${label}-cli.json`);
        await writeFile(configPath, JSON.stringify({
          sendResults: 'on-failure', slackLogLevel: 'error', showInThread: transport === 'bot',
          meta: [{ key: 'Harness run', value: `${runId}:${label}:cli` }],
          ...(transport === 'bot' ? { sendUsingBot: { channels: ['harness-failures'] } }
            : { sendUsingWebhook: { webhookUrl: 'https://example.invalid/harness-webhook' } }),
        }));
        await command(node, ['-r', preload, cli, '-c', configPath, '-j', resultsPath,
          ...(fixture.status === 'timedout' ? ['--run-status', fullResult.status] : [])], consumer, `${label}-cli`, env);
        await verifyCapture('cli');
        entry.status = 'passed';
        console.log(`[harness] ${label}: reporter and CLI verified locally`);
      } catch (error) {
        entry.error = error.message;
        report.errors.push(`${label}: ${error.message}`);
      }
    }
  }
}

async function cleanup() {
  if (!channel || !started || markers.size === 0) return;
  console.log('[harness] Cleaning up Slack messages');
  for (const channelId of new Set(markerChannels.values())) {
    try {
      for (const parent of await parents(channelId)) knownParents.set(`${channelId}:${parent.ts}`, { ...parent, harnessChannel: channelId });
    } catch (error) { report.errors.push(`Cleanup discovery: ${error.message}`); }
  }
  for (const parent of knownParents.values()) {
    const targetChannel = parent.harnessChannel;
    if (isWebhookReport(parent)) {
      report.cleanup.push({ channel: targetChannel, ts: parent.ts, retained: true, reason: 'Webhook reports are retained by design' });
      continue;
    }
    let replies = [];
    try {
      replies = (await pages('conversations.replies', { channel: targetChannel, ts: parent.ts }, 'messages'))
        .filter(message => message.ts !== parent.ts);
    } catch (error) { report.errors.push(`Cleanup thread discovery: ${error.message}`); }
    // Remove replies before their parent. Never touch messages from other users.
    for (const message of [...replies.reverse(), parent]) {
      try {
        assert(fromConfiguredBot(message), `Refusing to delete message ${message.ts} from another Slack app`);
        await slack('chat.delete', { channel: targetChannel, ts: message.ts });
        report.cleanup.push({ channel: targetChannel, ts: message.ts, deleted: true });
      } catch (error) {
        report.errors.push(`Cleanup ${message.ts}: ${error.message}`);
        report.cleanup.push({ channel: targetChannel, ts: message.ts, deleted: false });
      }
    }
  }
  for (const channelId of new Set(markerChannels.values())) {
    try { assert.equal((await parents(channelId)).filter(parent => !isWebhookReport(parent)).length, 0, 'Bot reports remain after cleanup'); }
    catch (error) { report.errors.push(`Cleanup verification: ${error.message}`); }
  }
}

function isWebhookReport(parent) {
  const text = messageText(parent);
  return [...webhookMarkers].some(marker => text.includes(marker));
}

try {
  if (!offline) {
    assert(token && webhook, 'Set SLACK_BOT_USER_OAUTH_TOKEN and SLACK_WEBHOOK_URL in harness/.env or the environment; use --offline for package/browser checks only');
    const auth = await slack('auth.test');
    botUser = auth.user_id;
    botId = auth.bot_id;
    const channels = await pages('conversations.list', { types: 'public_channel', exclude_archived: true }, 'channels');
    const resolveChannel = async name => {
      const found = channels.find(item => item.name === name || item.id === name);
      assert(found, `Slack channel ${name} was not found`);
      assert(found.is_member, `Invite the Slack bot into ${name}`);
      // Fail before posting anything if read-back permissions are unavailable.
      await slack('conversations.history', { channel: found.id, limit: 1 });
      return found.id;
    };
    botChannel = await resolveChannel(channelName);
    webhookChannel = await resolveChannel(webhookChannelName);
  }
  await command(bun, ['run', 'build'], root, 'build');
  await command(node, ['-e', 'if (process.versions.bun) process.exit(1)'], root, 'verify-node-runtime');
  consumer = await mkdtemp(path.join(tmpdir(), 'playwright-slack-harness-'));
  const packDir = path.join(consumer, 'packed');
  await mkdir(packDir);
  const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  const filename = 'consumer.tgz';
  await command(bun, ['pm', 'pack', '--filename', path.join(packDir, filename)], root, 'pack');
  const archive = new Bun.Archive(await readFile(path.join(packDir, filename)));
  const files = [...(await archive.files()).keys()].map(file => ({ path: file.replace(/^package\//, '') }));
  const pack = { filename, version: manifest.version, files };
  for (const required of ['dist/cli.js', 'dist/src/SlackReporter.js']) {
    assert(pack.files.some(file => file.path === required), `Tarball missing ${required}`);
  }
  assert(!pack.files.some(file => /(^|\/)(harness|tests|\.env)(\/|$)/.test(file.path)), 'Tarball contains harness/tests/credentials');
  await save('package-contents.json', pack);
  await cp(path.join(harness, 'consumer'), consumer, { recursive: true });
  for (const file of ['package.json', 'bun.lock']) await cp(path.join(harness, file), path.join(consumer, file));
  await command(bun, ['install', '--frozen-lockfile'], consumer, 'install-consumer');
  await command(bun, ['add', '--no-save', path.join(packDir, pack.filename)], consumer, 'install-tarball');
  const requireConsumer = createRequire(path.join(consumer, 'package.json'));
  const packagePath = await realpath(requireConsumer.resolve('playwright-slack-report/package.json'));
  assert(packagePath.startsWith(`${await realpath(consumer)}${path.sep}`), 'Consumer resolved the package outside its isolated installation');
  const cli = path.join(consumer, 'node_modules', 'playwright-slack-report', 'dist', 'cli.js');
  const pw = requireConsumer.resolve('@playwright/test/cli');
  await command(node, [cli, '--help'], consumer, 'cli-help');
  const cliVersion = await command(node, [cli, '--version'], consumer, 'cli-version');
  assert.equal(cliVersion.trim(), pack.version, 'CLI version differs from packaged version');
  await verifyRunLevelScenarios(pw, cli);
  await command(node, [pw, 'install', ...(process.platform === 'linux' ? ['--with-deps'] : []), 'chromium'], consumer, 'install-chromium');
  started = String(Date.now() / 1000);
  const port = await freePort();
  if (!offline) proxy = await startProxy();
  const modes = ['reporter-bot', 'reporter-webhook', 'cli-bot', 'cli-webhook'];
  const scenarios = offline ? [{ mode: 'offline', viaProxy: false }]
    : [false, true].flatMap(viaProxy => modes.map(mode => ({ mode, viaProxy })));
  let resultsPath;
  for (const { mode, viaProxy } of scenarios) {
    const label = viaProxy ? `proxy-${mode}` : mode;
    channel = mode.endsWith('webhook') ? webhookChannel : botChannel;
    const marker = `${runId}:${label}`;
    markers.add(marker);
    if (mode.endsWith('webhook')) webhookMarkers.add(marker);
    if (!offline) markerChannels.set(marker, channel);
    const env = { ...baseEnv(), HARNESS_MODE: mode, HARNESS_RUN_ID: marker, HARNESS_PORT: port, SLACK_CHANNEL: channel || channelName };
    if (mode.endsWith('bot')) env.SLACK_BOT_USER_OAUTH_TOKEN = token;
    if (mode === 'reporter-webhook') env.SLACK_WEBHOOK_URL = webhook;
    if (viaProxy) env.HARNESS_PROXY = proxy.url;
    const connectionIndex = proxy?.connections.length || 0;
    const entry = { mode, transport: viaProxy ? 'proxy' : 'direct', status: 'failed' };
    report.paths.push(entry);
    try {
      if (!mode.startsWith('cli-')) {
        resultsPath = path.join(consumer, `${label}-results.json`);
        env.HARNESS_JSON = resultsPath;
        await command(node, [pw, 'test'], consumer, label, env, 1);
        await verifyPlaywright(resultsPath);
      } else {
        const configPath = path.join(consumer, 'cli-config.json');
        const config = {
          sendResults: 'always', slackLogLevel: 'error', maxNumberOfFailures: 10,
          disableUnfurl: true, showInThread: mode.endsWith('bot'),
          ...(viaProxy ? { proxy: proxy.url } : {}),
          meta: [{ key: 'Harness run', value: marker }],
          ...(mode.endsWith('bot') ? { sendUsingBot: { channels: [channel] } } : { sendUsingWebhook: { webhookUrl: webhook } }),
        };
        await writeFile(configPath, JSON.stringify(config));
        try { await command(node, [cli, '-c', configPath, '-j', resultsPath], consumer, label, env); }
        finally { await rm(configPath, { force: true }); }
      }
      if (viaProxy) {
        const connections = proxy.connections.slice(connectionIndex);
        await save(`${label}-proxy.json`, connections);
        const expectedHost = mode.endsWith('bot') ? 'slack.com' : new URL(webhook).hostname;
        assert(connections.length > 0, `${label}: no traffic traversed the proxy`);
        assert(connections.every(connection => connection.host === expectedHost && connection.connected
          && connection.bytesUp > 0 && connection.bytesDown > 0 && !connection.error),
        `${label}: proxy did not successfully tunnel Slack traffic`);
        entry.proxyConnections = connections.length;
      }
      if (!offline) Object.assign(entry, await verifySlack(mode, marker, label));
      entry.status = 'passed';
      console.log(`[harness] ${label} verified${offline ? '; Slack verification SKIPPED' : ''}`);
    } catch (error) {
      entry.error = error.message;
      report.errors.push(`${label}: ${error.message}`);
    }
  }
  if (offline) report.slackVerification = 'SKIPPED: offline run; live direct/proxy scenarios require Slack credentials';
} catch (error) {
  report.errors.push(error.message);
} finally {
  if (proxy) {
    await save('proxy-connections.json', proxy.connections);
    await proxy.close();
  }
  await cleanup();
  if (consumer) {
    // Only remove the exact temporary directory created by this process.
    assert(path.dirname(consumer) === tmpdir() && path.basename(consumer).startsWith('playwright-slack-harness-'));
    try { await rm(consumer, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 }); }
    catch (error) { report.errors.push(`Temporary consumer cleanup: ${error.message}`); }
  }
  report.status = report.errors.length ? 'failed' : 'passed';
  await save('summary.json', report);
  console.log(`[harness] ${report.status}; diagnostics: ${artifacts}`);
  for (const error of report.errors) console.error(redact(error));
  process.exitCode = report.errors.length ? 1 : 0;
}
