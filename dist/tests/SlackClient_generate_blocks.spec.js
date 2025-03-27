"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const LayoutGenerator_1 = require("../src/LayoutGenerator");
test_1.test.describe('SlackClient.generateBlocks()', () => {
    (0, test_1.test)('includes warning message if number of failures exceeds maximum allowed', async () => {
        const generatedBlock = await (0, LayoutGenerator_1.generateBlocks)({
            failed: 3,
            passed: 0,
            flaky: undefined,
            skipped: 0,
            failures: [
                { suite: 'smoke', test: 'test', failureReason: 'message' },
                { suite: 'smoke', test: 'test2', failureReason: 'message' },
                { suite: 'smoke', test: 'test3', failureReason: 'message' },
            ],
            tests: [],
        }, 2);
        (0, test_1.expect)(generatedBlock[5]).toEqual({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*⚠️ There are too many failures to display - 2 out of 3 failures shown*',
            },
        });
    });
    (0, test_1.test)('showInThreads enabled - show warning message if number of failures exceeds maximum allowed', async () => {
        const generatedBlock = await (0, LayoutGenerator_1.generateFailures)({
            failed: 2,
            passed: 0,
            flaky: undefined,
            skipped: 0,
            failures: [
                { suite: 'smoke', test: 'test', failureReason: 'message' },
                { suite: 'smoke', test: 'test2', failureReason: 'message' },
                { suite: 'smoke', test: 'test3', failureReason: 'message' },
            ],
            tests: [],
        }, 1);
        (0, test_1.expect)(generatedBlock[2]).toEqual({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*⚠️ There are too many failures to display - 1 out of 3 failures shown*',
            },
        });
    });
    (0, test_1.test)('creates blocks with correct stats summary - flaky disabled', async () => {
        const generatedBlock = await (0, LayoutGenerator_1.generateBlocks)({
            failed: 1,
            passed: 1,
            flaky: undefined,
            skipped: 1,
            failures: [{ suite: 'smoke', test: 'test', failureReason: 'message' }],
            tests: [],
        }, 2);
        (0, test_1.expect)(generatedBlock).toEqual([
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
                type: 'divider',
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '*smoke > test*\n        \n>message',
                },
            },
        ]);
    });
    (0, test_1.test)('creates blocks with correct stats summary - flaky enabled', async () => {
        const generatedBlock = await (0, LayoutGenerator_1.generateBlocks)({
            failed: 1,
            passed: 1,
            flaky: 1,
            skipped: 1,
            failures: [{ suite: 'smoke', test: 'test', failureReason: 'message' }],
            tests: [],
        }, 2);
        (0, test_1.expect)(generatedBlock).toEqual([
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
                    text: '✅ *1* | ❌ *1* | 🟡 *1* | ⏩ *1*',
                },
            },
            {
                type: 'divider',
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '*smoke > test*\n        \n>message',
                },
            },
        ]);
    });
    (0, test_1.test)('creates blocks when meta provided', async () => {
        const generatedBlock = await (0, LayoutGenerator_1.generateBlocks)({
            failed: 0,
            passed: 1,
            flaky: undefined,
            skipped: 1,
            failures: [],
            tests: [],
            meta: [
                {
                    key: 'BuildID',
                    value: '9sdcv-312432-3134',
                },
            ],
        }, 2);
        (0, test_1.expect)(generatedBlock).toEqual([
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
                    text: '✅ *1* | ❌ *0* | ⏩ *1*',
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '\n*BuildID* :\t9sdcv-312432-3134',
                },
            },
        ]);
    });
    (0, test_1.test)('creates blocks when test with attachment is provided', async () => {
        const generatedBlock = await (0, LayoutGenerator_1.generateBlocks)({
            failed: 1,
            passed: 0,
            flaky: undefined,
            skipped: 1,
            failures: [],
            tests: [
                {
                    suiteName: 'accounts',
                    name: 'overdue will incur a penalty',
                    browser: 'chrome',
                    endedAt: new Date().toISOString(),
                    reason: '',
                    retry: 2,
                    startedAt: new Date().toISOString(),
                    status: 'passed',
                    attachments: [
                        {
                            body: 'www.google.com',
                            contentType: 'text/html',
                            name: 'test',
                            path: 'c:/test.html',
                        },
                    ],
                },
            ],
        }, 0);
        (0, test_1.expect)(generatedBlock).toEqual([
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
                    text: '✅ *0* | ❌ *1* | ⏩ *1*',
                },
            },
        ]);
    });
});
//# sourceMappingURL=SlackClient_generate_blocks.spec.js.map