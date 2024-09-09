"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LayoutGenerator_1 = require("./LayoutGenerator");
class SlackWebhookClient {
    webhook;
    constructor(webhook) {
        this.webhook = webhook;
    }
    async sendMessage({ customLayout, customLayoutAsync, maxNumberOfFailures, summaryResults, disableUnfurl, }) {
        let blocks;
        if (customLayout) {
            blocks = customLayout(summaryResults);
        }
        else if (customLayoutAsync) {
            blocks = await customLayoutAsync(summaryResults);
        }
        else {
            blocks = await (0, LayoutGenerator_1.generateBlocks)(summaryResults, maxNumberOfFailures);
        }
        let result;
        try {
            result = await this.webhook.send({
                blocks,
                unfurl_links: !disableUnfurl,
            });
        }
        catch (error) {
            return {
                outcome: `error: ${JSON.stringify(error, null, 2)}`,
            };
        }
        if (result && result.text === 'ok') {
            return {
                outcome: result.text,
            };
        }
        return {
            outcome: '😵 Failed to send webhook message, ensure your webhook url is valid',
        };
    }
}
exports.default = SlackWebhookClient;
//# sourceMappingURL=SlackWebhookClient.js.map