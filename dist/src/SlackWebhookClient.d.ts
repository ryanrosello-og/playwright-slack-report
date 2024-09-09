import { IncomingWebhook } from '@slack/webhook';
import { SummaryResults } from '.';
export default class SlackWebhookClient {
    private webhook;
    constructor(webhook: IncomingWebhook);
    sendMessage({ customLayout, customLayoutAsync, maxNumberOfFailures, summaryResults, disableUnfurl, }: {
        customLayout: Function | undefined;
        customLayoutAsync: Function | undefined;
        maxNumberOfFailures: number;
        summaryResults: SummaryResults;
        disableUnfurl: boolean;
    }): Promise<{
        outcome: string;
    }>;
}
