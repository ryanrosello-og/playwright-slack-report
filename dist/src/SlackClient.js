"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LayoutGenerator_1 = require("./LayoutGenerator");
class SlackClient {
    slackWebClient;
    constructor(slackClient) {
        this.slackWebClient = slackClient;
    }
    async sendMessage({ options, }) {
        let blocks;
        if (options.customLayout) {
            blocks = options.customLayout(options.summaryResults);
        }
        else if (options.customLayoutAsync) {
            blocks = await options.customLayoutAsync(options.summaryResults);
        }
        else if (options.showInThread) {
            const modifiedOptions = JSON.parse(JSON.stringify(options));
            modifiedOptions.summaryResults.failures = [];
            blocks = await (0, LayoutGenerator_1.generateBlocks)(modifiedOptions.summaryResults, options.maxNumberOfFailures);
        }
        else {
            blocks = await (0, LayoutGenerator_1.generateBlocks)(options.summaryResults, options.maxNumberOfFailures);
        }
        if (!options.channelIds) {
            throw new Error(`Channel ids [${options.channelIds}] is not valid`);
        }
        const fallbackText = (0, LayoutGenerator_1.generateFallbackText)(options.summaryResults);
        const result = [];
        const unfurl = !options.disableUnfurl;
        for (const channel of options.channelIds) {
            let chatResponse;
            try {
                // under test
                if (options.fakeRequest) {
                    chatResponse = await options.fakeRequest();
                }
                else {
                    // send request for reals
                    chatResponse = await SlackClient.doPostRequest(this.slackWebClient, channel, fallbackText, blocks, unfurl);
                }
                if (chatResponse.ok) {
                    result.push({
                        channel,
                        outcome: `✅ Message sent to ${channel}`,
                        ts: chatResponse.ts,
                    });
                    // eslint-disable-next-line no-console
                    console.log(`✅ Message sent to ${channel}`);
                }
                else {
                    result.push({
                        channel,
                        outcome: `❌ Message not sent to ${channel} \r\n ${JSON.stringify(chatResponse, null, 2)}`,
                    });
                }
            }
            catch (error) {
                result.push({
                    channel,
                    outcome: `❌ Message not sent to ${channel} \r\n ${error.message}`,
                });
            }
        }
        return result;
    }
    async attachDetailsToThread({ channelIds, ts, summaryResults, maxNumberOfFailures, disableUnfurl, fakeRequest, }) {
        const result = [];
        const blocks = await (0, LayoutGenerator_1.generateFailures)(summaryResults, maxNumberOfFailures);
        const fallbackText = (0, LayoutGenerator_1.generateFallbackText)(summaryResults);
        for (const channel of channelIds) {
            // under test
            let chatResponse;
            if (fakeRequest) {
                chatResponse = await fakeRequest();
            }
            else {
                chatResponse = await SlackClient.doPostRequest(this.slackWebClient, channel, fallbackText, blocks, disableUnfurl, ts);
            }
            if (chatResponse.ok) {
                // eslint-disable-next-line no-console
                console.log(`✅ Message sent to ${channel} within thread ${ts}`);
                result.push({
                    channel,
                    outcome: `✅ Message sent to ${channel} within thread ${ts}`,
                    ts: chatResponse.ts,
                });
            }
        }
        return result;
    }
    static async doPostRequest(slackWebClient, channel, fallbackText, blocks, unfurl, threadTimestamp) {
        const chatResponse = await slackWebClient.chat.postMessage({
            channel,
            text: fallbackText,
            unfurl_links: unfurl,
            blocks,
            thread_ts: threadTimestamp,
        });
        return chatResponse;
    }
}
exports.default = SlackClient;
//# sourceMappingURL=SlackClient.js.map