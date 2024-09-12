"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const webhook_1 = require("@slack/webhook");
const ts_sinon_1 = require("ts-sinon");
const SlackWebhookClient_1 = __importDefault(require("../src/SlackWebhookClient"));
const test = test_1.test.extend({
    summaryResults: {
        failed: 1,
        passed: 1,
        flaky: undefined,
        skipped: 1,
        failures: [
            {
                suite: 'smoke',
                test: 'test',
                failureReason: 'Unexpected error',
            },
        ],
        meta: [
            {
                key: 'Build',
                value: '1.0.0',
            },
        ],
        tests: [
            {
                suiteName: 'checkout',
                name: 'add to cart',
                browser: 'chromium',
                projectName: 'playwright-slack-report',
                endedAt: '2021-08-04T14:00:00.000Z',
                reason: 'Unexpected error',
                retry: 0,
                startedAt: '2021-08-04T14:00:00.000Z',
                status: 'failed',
            },
        ],
    },
});
test.describe('SlackWebhookClient.sendMessage()', () => {
    test('returns ok when the message provided is valid', async ({ summaryResults, }) => {
        const webhook = new webhook_1.IncomingWebhook('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
        const webHookStub = (0, ts_sinon_1.stubObject)(webhook);
        webHookStub.send.resolves({ text: 'ok' });
        const client = new SlackWebhookClient_1.default(webHookStub);
        const result = await client.sendMessage({
            customLayout: undefined,
            customLayoutAsync: undefined,
            maxNumberOfFailures: 10,
            summaryResults,
            disableUnfurl: true,
        });
        (0, test_1.expect)(result).toEqual({ outcome: 'ok' });
        (0, test_1.expect)(webHookStub.send.args[0][0]).toEqual({
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '🎭 *Playwright Results*',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '✅ *1* | ❌ *1* | ⏩ *1*',
                    },
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '\n*Build* :\t1.0.0',
                    },
                },
                {
                    type: 'divider',
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: '*smoke > test*\n        \n>Unexpected error',
                    },
                },
            ],
            unfurl_links: false,
        });
    });
    test('returns an error message when sending message to webhook fails', async ({ summaryResults, }) => {
        const webhook = new webhook_1.IncomingWebhook('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX');
        const webHookStub = (0, ts_sinon_1.stubObject)(webhook);
        webHookStub.send.resolves(undefined);
        const client = new SlackWebhookClient_1.default(webHookStub);
        const result = await client.sendMessage({
            customLayout: undefined,
            customLayoutAsync: undefined,
            maxNumberOfFailures: 10,
            summaryResults,
            disableUnfurl: true,
        });
        (0, test_1.expect)(result).toEqual({
            outcome: '😵 Failed to send webhook message, ensure your webhook url is valid',
        });
    });
});
//# sourceMappingURL=SlackWehookClient.spec.js.map