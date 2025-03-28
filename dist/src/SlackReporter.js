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
    customSuccessLayout;
    maxNumberOfFailuresToShow;
    showInThread;
    meta = [];
    resultsParser;
    sendResults = 'on-failure';
    slackChannels = [];
    onSuccessSlackChannels = [];
    teamSlackChannels = [];
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
            this.customSuccessLayout = slackReporterConfig.onSuccessLayout;
            this.slackChannels = slackReporterConfig.channels;
            this.onSuccessSlackChannels
                = slackReporterConfig.onSuccessChannels || this.slackChannels;
            this.teamSlackChannels = slackReporterConfig.teamChannels || [];
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
        // Use webhook if provided
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
            console.log(JSON.stringify(webhookResult, null, 2));
        }
        else {
            // Use OAuth token if provided
            const slackClient = new SlackClient_1.default(new web_api_1.WebClient(this.slackOAuthToken || process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
                logLevel: this.slackLogLevel || web_api_1.LogLevel.DEBUG,
                agent,
            }));
            // No failures, send complete results to onSuccessSlackChannels
            if (!testsFailed && this.onSuccessSlackChannels) {
                for (const channel of this.onSuccessSlackChannels) {
                    await this.postResults(slackClient, channel, resultSummary, false, false);
                }
            }
            // There are failures, send complete results to slackChannels
            if (testsFailed && this.slackChannels) {
                for (const channel of this.slackChannels) {
                    await this.postResults(slackClient, channel, resultSummary, false, false);
                }
            }
            // Send individual results to each team channel if any
            if (this.teamSlackChannels) {
                console.log('\nSending team results\n');
                // Send failure results to each channel
                const failuresGroupedByTeam = await this.resultsParser.getParsedFailureResultsByPattern(this.teamSlackChannels);
                console.log('\nfailuresGroupedByTeam length: ', failuresGroupedByTeam.length);
                console.log('\nfailuresGroupedByTeam:');
                failuresGroupedByTeam.forEach((element) => {
                    console.log(`\n${JSON.stringify(element)}`);
                });
                for (const { channel, team, summary } of failuresGroupedByTeam) {
                    // New copy of this.meta instead of reference, to avoid data accumulation
                    summary.meta = [...this.meta];
                    summary.meta.push({ key: 'Team', value: team });
                    console.log(`\nSending failure results of ${team}`);
                    await this.postResults(slackClient, channel, summary, true, true);
                }
                // Send success results to each team that did not have any failures
                const successGroupedByTeam = await this.resultsParser.getParsedSuccessResultsByPatternWithoutFailures(this.teamSlackChannels);
                console.log('\nsuccessGroupedByTeam length: ', successGroupedByTeam.length);
                console.log('\nsuccessGroupedByTeam:');
                successGroupedByTeam.forEach((element) => {
                    console.log(`\n${JSON.stringify(element)}`);
                });
                for (const { channel, team, summary } of successGroupedByTeam) {
                    // New copy of this.meta instead of reference, to avoid data accumulation
                    summary.meta = [...this.meta];
                    summary.meta.push({ key: 'Team', value: team });
                    await this.postResults(slackClient, channel, summary, false, true);
                }
            }
        }
    }
    preChecks() {
        const noSuccessChannelsProvided = this.sendResults === 'always'
            && (!this.onSuccessSlackChannels
                || this.onSuccessSlackChannels.length === 0);
        const noFailureChannelsProvided = ['always', 'on-failure'].includes(this.sendResults)
            && (!this.teamSlackChannels || this.teamSlackChannels.length === 0)
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
        if (this.customSuccessLayout
            && typeof this.customSuccessLayout !== 'function') {
            return {
                okToProceed: false,
                message: '❌ On Success Layout is not a function',
            };
        }
        if (this.meta && !Array.isArray(this.meta)) {
            return { okToProceed: false, message: '❌ Meta is not an array' };
        }
        return { okToProceed: true };
    }
    log(message) {
        console.log(message);
        if (message) {
            this.logs.push(message);
        }
    }
    printsToStdio() {
        return false;
    }
    async postResults(slackClient, channelName, summary, isFailureReport, isTeamReport) {
        let reportLayout;
        let reportLayoutAsync;
        const channel = [];
        channel.push(channelName);
        if (isFailureReport && isTeamReport) {
            reportLayout = this.customFailureLayout;
            reportLayoutAsync = this.customFailureLayoutAsync;
        }
        else if (!isFailureReport && isTeamReport) {
            reportLayout = this.customSuccessLayout;
            reportLayoutAsync = this.customLayoutAsync;
        }
        else if (!isTeamReport) {
            reportLayout = this.customLayout;
            reportLayoutAsync = this.customLayoutAsync;
        }
        const resultList = await slackClient.sendMessage({
            options: {
                channelIds: channel,
                customLayout: reportLayout,
                customLayoutAsync: reportLayoutAsync,
                maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                disableUnfurl: this.disableUnfurl,
                summaryResults: summary,
                showInThread: this.showInThread,
            },
        });
        console.log(JSON.stringify(resultList, null, 2));
        if (this.showInThread && summary.failures.length > 0) {
            for (const result of resultList) {
                await slackClient.attachDetailsToThread({
                    channelIds: [result.channel],
                    ts: result.ts,
                    summaryResults: summary,
                    maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                });
            }
        }
    }
}
exports.default = SlackReporter;
//# sourceMappingURL=SlackReporter.js.map