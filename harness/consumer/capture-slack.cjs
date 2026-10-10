// Local transport capture for package integration tests; no Slack traffic.
const Module = require('node:module');
const { appendFileSync } = require('node:fs');
let sequence = 0;
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  const actual = originalLoad.call(this, request, parent, isMain);
  if (!process.env.HARNESS_CAPTURE) return actual;
  const record = (transport, payload) => {
    const ts = `100.${++sequence}`;
    appendFileSync(process.env.HARNESS_CAPTURE, `${JSON.stringify({ transport, payload, ts })}\n`);
    return { ok: true, channel: payload.channel, ts };
  };
  if (request === '@slack/web-api') return {
    ...actual,
    WebClient: class {
      constructor() { this.chat = { postMessage: async payload => record('bot', payload) }; }
    },
  };
  if (request === '@slack/webhook') return {
    ...actual,
    IncomingWebhook: class {
      async send(payload) { record('webhook', payload); return { text: 'ok' }; }
    },
  };
  return actual;
};
