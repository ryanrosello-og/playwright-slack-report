import { mock } from 'bun:test';
import { appendFileSync } from 'node:fs';

let sequence = 0;
const record = (transport: string, payload: any) => {
  const ts = `100.${++sequence}`;
  appendFileSync(
    process.env.HARNESS_CAPTURE!,
    `${JSON.stringify({ transport, payload, ts })}\n`,
  );
  return { ok: true, channel: payload.channel, ts };
};
mock.module('@slack/web-api', () => ({
  LogLevel: { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' },
  WebClient: class {
    chat = { postMessage: async (payload: any) => record('bot', payload) };
  },
}));
mock.module('@slack/webhook', () => ({
  IncomingWebhook: class {
    async send(payload: any) {
      record('webhook', payload);
      return { text: 'ok' };
    }
  },
}));
