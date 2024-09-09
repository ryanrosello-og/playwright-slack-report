"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const my_block_1 = __importDefault(require("../custom_block/my_block"));
const fixtures_1 = require("./fixtures");
fixtures_1.test.describe('SlackClient.sendMessage()', () => {
    (0, fixtures_1.test)('sends message using default block layout', async ({ testSlackClient, testSummaryAllTestsPassed, }) => {
        const fakeRequest = async () => ({
            ok: true,
        });
        const channelId = 'C12345';
        const clientResponse = await testSlackClient.sendMessage({
            options: {
                channelIds: [channelId],
                summaryResults: testSummaryAllTestsPassed,
                customLayout: undefined,
                customLayoutAsync: undefined,
                fakeRequest,
                maxNumberOfFailures: 10,
                showInThread: false,
            },
        });
        (0, test_1.expect)(clientResponse).toEqual([
            {
                channel: channelId,
                outcome: '✅ Message sent to C12345',
            },
        ]);
    });
    (0, fixtures_1.test)('sends message using a custom block layout', async ({ testSlackClient, testSummaryAllTestsFailed, }) => {
        const fakeRequest = async () => ({
            ok: true,
        });
        const channelId = 'C12345';
        const clientResponse = await testSlackClient.sendMessage({
            options: {
                channelIds: [channelId],
                summaryResults: testSummaryAllTestsFailed,
                customLayout: my_block_1.default,
                customLayoutAsync: undefined,
                fakeRequest,
                maxNumberOfFailures: 10,
                showInThread: false,
            },
        });
        (0, test_1.expect)(clientResponse).toEqual([
            {
                channel: channelId,
                outcome: '✅ Message sent to C12345',
            },
        ]);
    });
    (0, fixtures_1.test)('sends message with shownInThreads enabled', async ({ testSlackClient, testSummaryAllTestsFailed, }) => {
        const fakeRequest = async () => ({
            ok: true,
        });
        const channelId = 'C12345';
        const clientResponse = await testSlackClient.sendMessage({
            options: {
                channelIds: [channelId],
                summaryResults: testSummaryAllTestsFailed,
                customLayout: my_block_1.default,
                customLayoutAsync: undefined,
                fakeRequest,
                maxNumberOfFailures: 10,
                showInThread: true,
            },
        });
        (0, test_1.expect)(clientResponse).toEqual([
            {
                channel: channelId,
                outcome: '✅ Message sent to C12345',
            },
        ]);
    });
    (0, fixtures_1.test)('attach error details when showInThreads option is enabled', async ({ testSlackClient, testSummaryAllTestsFailed, }) => {
        const fakeRequest = async () => ({
            ok: true,
        });
        const channelId = 'C12345';
        const clientResponse = await testSlackClient.attachDetailsToThread({
            channelIds: [channelId],
            ts: '1684631671.947369',
            summaryResults: testSummaryAllTestsFailed,
            maxNumberOfFailures: 10,
            fakeRequest,
        });
        (0, test_1.expect)(clientResponse).toEqual([
            {
                channel: channelId,
                outcome: '✅ Message sent to C12345 within thread 1684631671.947369',
            },
        ]);
    });
    (0, fixtures_1.test)('provides an error when posting message to Slack fails', async ({ testSlackClient, testSummaryAllTestsPassed, }) => {
        const fakeFailedRequest = async () => {
            throw new Error('Something went wrong');
        };
        const channelId = 'C12345';
        const clientResponse = await testSlackClient.sendMessage({
            options: {
                channelIds: [channelId],
                summaryResults: testSummaryAllTestsPassed,
                customLayout: undefined,
                customLayoutAsync: undefined,
                fakeRequest: fakeFailedRequest,
                maxNumberOfFailures: 10,
                showInThread: false,
            },
        });
        (0, test_1.expect)(clientResponse).toEqual([
            {
                channel: channelId,
                outcome: '❌ Message not sent to C12345 \r\n Something went wrong',
            },
        ]);
    });
});
//# sourceMappingURL=SlackClient_send_message.spec.js.map