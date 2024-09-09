"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_api_1 = require("@slack/web-api");
const https_proxy_agent_1 = require("https-proxy-agent");
const webhook_1 = require("@slack/webhook");
const ResultsParser_1 = __importDefault(require("./ResultsParser"));
const SlackClient_1 = __importDefault(require("./SlackClient"));
const SlackWebhookClient_1 = __importDefault(require("./SlackWebhookClient"));
class SlackReporter {
    customLayout;
    customLayoutAsync;
    customFailureLayout;
    customFailureLayoutAsync;
    maxNumberOfFailuresToShow;
    showInThread;
    meta = [];
    resultsParser;
    sendResults = 'on-failure';
    slackChannels = [];
    onSuccessSlackChannels = [];
    onFailureSlackChannels = [];
    slackLogLevel;
    slackOAuthToken;
    slackWebHookUrl;
    slackWebHookChannel;
    disableUnfurl;
    proxy;
    browsers = [];
    suite;
    logs = [];
    onBegin(fullConfig, suite) {
        this.suite = suite;
        this.logs = [];
        const slackReporterConfig = fullConfig.reporter.filter((f) => f[0].toLowerCase().includes('slackreporter'))[0][1];
        if (fullConfig.projects.length === 0) {
            this.browsers = [];
        }
        else {
            // eslint-disable-next-line max-len
            this.browsers = fullConfig.projects.map((obj) => ({
                projectName: obj.name,
                browser: obj.use.browserName
                    ? obj.use.browserName
                    : obj.use.defaultBrowserType,
            }));
        }
        if (slackReporterConfig) {
            this.meta = slackReporterConfig.meta || [];
            this.sendResults = slackReporterConfig.sendResults || 'always';
            this.customLayout = slackReporterConfig.layout;
            this.customLayoutAsync = slackReporterConfig.layoutAsync;
            this.customFailureLayout = slackReporterConfig.onFailureLayout;
            this.customFailureLayoutAsync = slackReporterConfig.onFailureLayoutAsync;
            this.slackChannels = slackReporterConfig.channels;
            this.onSuccessSlackChannels
                = slackReporterConfig.onSuccessChannels || this.slackChannels;
            this.onFailureSlackChannels = slackReporterConfig.onFailureChannels || [];
            this.maxNumberOfFailuresToShow
                = slackReporterConfig.maxNumberOfFailuresToShow !== undefined
                    ? slackReporterConfig.maxNumberOfFailuresToShow
                    : 10;
            this.slackOAuthToken = slackReporterConfig.slackOAuthToken || undefined;
            this.slackWebHookUrl = slackReporterConfig.slackWebHookUrl || undefined;
            this.slackWebHookChannel
                = slackReporterConfig.slackWebHookChannel || undefined;
            this.disableUnfurl = slackReporterConfig.disableUnfurl || false;
            this.showInThread = slackReporterConfig.showInThread || false;
            this.slackLogLevel = slackReporterConfig.slackLogLevel || web_api_1.LogLevel.DEBUG;
            this.proxy = slackReporterConfig.proxy || undefined;
        }
        this.resultsParser = new ResultsParser_1.default();
    }
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    onTestEnd(test, result) {
        this.resultsParser.addTestResult(test.parent.title, test, this.browsers);
    }
    async onEnd() {
        const { okToProceed, message } = this.preChecks();
        if (!okToProceed) {
            this.log(message);
            return;
        }
        const resultSummary = await this.resultsParser.getParsedResults(this.suite.allTests());
        resultSummary.meta = this.meta;
        const testsFailed = resultSummary.failed > 0;
        if (this.sendResults === 'on-failure' && !testsFailed) {
            this.log('⏩ Slack reporter - no failures found');
            return;
        }
        if (resultSummary.passed === 0
            && resultSummary.failed === 0
            && resultSummary.flaky === 0
            && resultSummary.skipped === 0
            && resultSummary.failures.length === 0
            && resultSummary.tests.length === 0) {
            this.log('⏩ Slack reporter - Playwright reported : "No tests found"');
            return;
        }
        const agent = this.proxy ? new https_proxy_agent_1.HttpsProxyAgent(this.proxy) : undefined;
        if (this.slackWebHookUrl) {
            const webhook = new webhook_1.IncomingWebhook(this.slackWebHookUrl, {
                channel: this.slackWebHookChannel,
                agent,
            });
            const slackWebhookClient = new SlackWebhookClient_1.default(webhook);
            const webhookResult = await slackWebhookClient.sendMessage({
                customLayout: this.customLayout,
                customLayoutAsync: this.customLayoutAsync,
                maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                disableUnfurl: this.disableUnfurl,
                summaryResults: resultSummary,
            });
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(webhookResult, null, 2));
        }
        else {
            const slackClient = new SlackClient_1.default(new web_api_1.WebClient(this.slackOAuthToken || process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
                logLevel: this.slackLogLevel || web_api_1.LogLevel.DEBUG,
                agent,
            }));
            if (!testsFailed && this.onSuccessSlackChannels) {
                // Send complete results when no failures found
                for (const channel of this.onSuccessSlackChannels) {
                    await this.postResults(slackClient, channel, resultSummary, false);
                }
            }
            else if (testsFailed) {
                // There are failures
                // Send complete results to slackChannels
                for (const channel of this.slackChannels) {
                    await this.postResults(slackClient, channel, resultSummary, false);
                }
                // Send failure results to each 'on failure' channel if any, filtering by team
                if (this.onFailureSlackChannels) {
                    const failuresByTeam = await this.resultsParser.getParsedFailureResultsByTeam(this.onFailureSlackChannels);
                    for (const [team, summary] of failuresByTeam.entries()) {
                        summary.meta = this.meta;
                        await this.postResults(slackClient, team, summary, true);
                    }
                }
            }
        }
    }
    preChecks() {
        const noSuccessChannelsProvided = this.sendResults === 'always'
            && (!this.onSuccessSlackChannels
                || this.onSuccessSlackChannels.length === 0);
        const noFailureChannelsProvided = ['always', 'on-failure'].includes(this.sendResults)
            && (!this.onFailureSlackChannels
                || this.onFailureSlackChannels.length === 0)
            && (!this.slackChannels || this.slackChannels.length === 0);
        if (this.sendResults === 'off') {
            return { okToProceed: false, message: '❌ Slack reporter is disabled' };
        }
        if (!this.slackWebHookUrl
            && !this.slackOAuthToken
            && !process.env.SLACK_BOT_USER_OAUTH_TOKEN) {
            return {
                okToProceed: false,
                message: '❌ Neither slack webhook url, slackOAuthToken nor process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
            };
        }
        if (this.slackWebHookUrl
            && (process.env.SLACK_BOT_USER_OAUTH_TOKEN || this.slackOAuthToken)) {
            return {
                okToProceed: false,
                message: '❌ You can only enable a single option, either provide a slack webhook url, slackOAuthToken or process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
            };
        }
        if (this.slackWebHookUrl && this.showInThread) {
            return {
                okToProceed: false,
                message: '❌ The showInThread feature is only supported when using slackOAuthToken or process.env.SLACK_BOT_USER_OAUTH_TOKEN',
            };
        }
        if (!this.sendResults
            || !['always', 'on-failure', 'off'].includes(this.sendResults)) {
            return {
                okToProceed: false,
                message: "❌ \"sendResults\" is not valid. Expecting one of ['always', 'on-failure', 'off'].",
            };
        }
        if (noSuccessChannelsProvided) {
            return {
                okToProceed: false,
                message: '❌ Slack channel(s) for successful tests notifications was not provided in the config',
            };
        }
        if (noFailureChannelsProvided) {
            return {
                okToProceed: false,
                message: '❌ Slack channel(s) for failed tests notifications was not provided in the config',
            };
        }
        if (this.customLayout && typeof this.customLayout !== 'function') {
            return {
                okToProceed: false,
                message: '❌ Custom layout is not a function',
            };
        }
        if (this.customLayoutAsync
            && typeof this.customLayoutAsync !== 'function') {
            return {
                okToProceed: false,
                message: '❌ customLayoutAsync is not a function',
            };
        }
        if (this.customFailureLayout
            && typeof this.customFailureLayout !== 'function') {
            return {
                okToProceed: false,
                message: '❌ On Failure Layout is not a function',
            };
        }
        if (this.customFailureLayoutAsync
            && typeof this.customFailureLayoutAsync !== 'function') {
            return {
                okToProceed: false,
                message: '❌ On Failure Layout Async is not a function',
            };
        }
        if (this.meta && !Array.isArray(this.meta)) {
            return { okToProceed: false, message: '❌ Meta is not an array' };
        }
        return { okToProceed: true };
    }
    log(message) {
        // eslint-disable-next-line no-console
        console.log(message);
        if (message) {
            this.logs.push(message);
        }
    }
    // eslint-disable-next-line class-methods-use-this
    printsToStdio() {
        return false;
    }
    async postResults(slackClient, channelName, summary, isFailureReport) {
        const channel = [];
        channel.push(channelName);
        const result = await slackClient.sendMessage({
            options: {
                channelIds: channel,
                customLayout: isFailureReport
                    ? this.customFailureLayout
                    : this.customLayout,
                customLayoutAsync: isFailureReport
                    ? this.customFailureLayoutAsync
                    : this.customLayoutAsync,
                maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                disableUnfurl: this.disableUnfurl,
                summaryResults: summary,
                showInThread: this.showInThread,
            },
        });
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
        if (this.showInThread && summary.failures.length > 0) {
            for (let i = 0; i < result.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await slackClient.attachDetailsToThread({
                    channelIds: [result[i].channel],
                    ts: result[i].ts,
                    summaryResults: summary,
                    maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                });
            }
        }
    }
}
exports.default = SlackReporter;
//# sourceMappingURL=SlackReporter.js.map