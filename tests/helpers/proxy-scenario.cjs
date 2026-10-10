// Run the real entry points in a fresh process, mocking only external SDKs.
// This isolates module caches and global fetch state between test cases.
const Module = require('node:module');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
// Match the worker compiler so nyc sees one generated layout per source file.
const { transform } = require('playwright/lib/common');

const scenario = JSON.parse(process.env.PROXY_UNIT_SCENARIO);
delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
delete process.env.SLACK_WEBHOOK_URL;
if (scenario.transport === 'bot') process.env.SLACK_BOT_USER_OAUTH_TOKEN = 'unit-test-token';

const result = {
  undiciLoads: 0, loadsAfterImport: 0, proxyAgents: [], httpsAgents: [],
  clients: [], webhooks: [], fetchCalls: [], posts: 0, sends: 0,
};
const response = { ok: true, ts: '123.456', channel: 'unit-channel' };
const requestInit = {
  method: 'POST', headers: { 'x-unit-header': 'preserved' }, body: 'unit-body',
  signal: new AbortController().signal,
};
const nativeFetch = async () => response;
global.fetch = nativeFetch;

class ProxyAgent {
  constructor(url) { this.url = url; result.proxyAgents.push(url); }
}
class HttpsProxyAgent {
  constructor(url) { this.url = url; result.httpsAgents.push(url); }
}
class WebClient {
  constructor(token, options) {
    result.clients.push({ token, hasFetch: typeof options.fetch === 'function' });
    this.chat = {
      postMessage: async () => {
        result.posts++;
        if (options.fetch) {
          const actual = await options.fetch('https://slack.com/api/chat.postMessage', requestInit);
          result.fetchResponsePreserved = actual === response;
        }
        return response;
      },
    };
  }
}
class IncomingWebhook {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    result.webhooks.push({
      url, hasFetch: typeof options.fetch === 'function',
      hasAgent: 'agent' in options, channel: options.channel,
    });
  }
  async send() {
    result.sends++;
    if (this.options.fetch) {
      const actual = await this.options.fetch(this.url, requestInit);
      result.fetchResponsePreserved = actual === response;
    }
    return { text: 'ok' };
  }
}
class ResultsParser {
  async getParsedResults() {
    return { passed: scenario.empty ? 0 : 1, failed: 0, flaky: 0, skipped: 0, failures: [], tests: [] };
  }
  async parseFromJsonFile() { return this.getParsedResults(); }
}

// Playwright preserves dynamic import(), so intercept its resolution as well
// as CommonJS require(). Both paths load the same mock without network access.
Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === 'undici'
      ? pathToFileURL(require.resolve('./proxy-undici.cjs')).href : specifier, context);
  },
});
exports.loadUndici = () => {
  result.undiciLoads++;
  if (!scenario.proxy) throw new Error('undici must not load without a proxy');
  // Model the global side effect responsible for the original regression.
  global.fetch = async () => { throw new Error('unexpected global undici fetch'); };
  return {
    ProxyAgent,
    fetch: async (url, init) => {
      result.fetchCalls.push({ url, dispatcherUrl: init.dispatcher?.url });
      result.requestInitPreserved = init.method === requestInit.method
        && init.headers === requestInit.headers && init.body === requestInit.body
        && init.signal === requestInit.signal && init.dispatcher instanceof ProxyAgent;
      return response;
    },
  };
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'undici') return exports.loadUndici();
  if (request === '@slack/web-api') return { WebClient, LogLevel: { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' } };
  if (request === '@slack/webhook') return { IncomingWebhook };
  if (request === 'https-proxy-agent') return { HttpsProxyAgent };
  if (request.endsWith('/ResultsParser')) return { __esModule: true, default: ResultsParser };
  return originalLoad.call(this, request, parent, isMain);
};

function output() {
  result.globalFetchPreserved = global.fetch === nativeFetch;
  console.log(`PROXY_UNIT_RESULT=${JSON.stringify(result)}`);
}

if (scenario.entryPoint === 'cli') {
  process.argv = [process.execPath, path.resolve('cli.ts'), '-c', scenario.configPath, '-j', scenario.resultsPath];
  const originalExit = process.exit;
  process.exit = code => { output(); originalExit(code); };
  transform.requireOrImport(path.resolve('cli.ts')).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
  result.loadsAfterImport = result.undiciLoads;
} else {
  const reporterModule = transform.requireOrImport(path.resolve('src/SlackReporter.ts'));
  result.loadsAfterImport = result.undiciLoads;
  reporterModule.then(async ({ default: SlackReporter }) => {
    const reporter = new SlackReporter();
    const options = {
      channels: ['unit-channel'], sendResults: scenario.sendResults || 'always',
      proxy: scenario.proxy, slackLogLevel: 'error',
      ...(scenario.transport === 'webhook' ? {
        slackWebHookUrl: 'https://example.invalid/unit-webhook', slackWebHookChannel: 'unit-channel',
      } : {}),
    };
    reporter.onBegin({ projects: [], reporter: [['SlackReporter', options]] }, { allTests: () => [] });
    await reporter.onEnd();
    output();
  }).catch(error => { console.error(error); process.exitCode = 1; });
}
