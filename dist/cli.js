#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const commander_1 = require("commander");
const web_api_1 = require("@slack/web-api");
const https_proxy_agent_1 = require("https-proxy-agent");
const webhook_1 = require("@slack/webhook");
const path_1 = __importDefault(require("path"));
const ResultsParser_1 = __importDefault(require("./src/ResultsParser"));
const SlackClient_1 = __importDefault(require("./src/SlackClient"));
const cli_pre_checks_1 = __importDefault(require("./src/cli/cli_pre_checks"));
const SlackWebhookClient_1 = __importDefault(require("./src/SlackWebhookClient"));
const program = new commander_1.Command();
program
    .name('playwright-slack-report - cli')
    .version('1.0.0')
    .description('📦 Send Playwright json results to directly Slack ')
    .option('-c, --config <path>', 'Configuration file for the CLI app e.g ./config.json')
    .option('-j, --json-results <path>', 'Generated Playwright json results file e.g. ./results.json')
    .action(async (options) => {
    const preCheckResult = await (0, cli_pre_checks_1.default)(options.jsonResults, options.config);
    const config = preCheckResult.config;
    if (preCheckResult.status === 'error') {
        console.error(`❌ ${preCheckResult.message}`);
        process.exit(1);
    }
    const agent = config.proxy ? new https_proxy_agent_1.HttpsProxyAgent(config.proxy) : undefined;
    const resultsParser = new ResultsParser_1.default();
    const resultSummary = await resultsParser.parseFromJsonFile(preCheckResult.jsonPath);
    if (config.sendUsingBot) {
        const slackClient = new SlackClient_1.default(new web_api_1.WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
            logLevel: config.slackLogLevel,
            agent,
        }));
        const success = await sendResultsUsingBot({
            resultSummary,
            slackClient,
            config,
        });
        if (!success) {
            console.error('❌ Failed to send results to Slack');
            process.exit(1);
        }
        else {
            console.log('✅ Results sent to Slack');
            process.exit(0);
        }
    }
    if (config.sendUsingWebhook) {
        const webhook = new webhook_1.IncomingWebhook(config.sendUsingWebhook.webhookUrl, {
            agent,
        });
        const slackWebhookClient = new SlackWebhookClient_1.default(webhook);
        let summaryResults = resultSummary;
        const meta = replaceEnvVars(config.meta);
        summaryResults = { ...resultSummary, meta };
        const webhookResult = await slackWebhookClient.sendMessage({
            customLayout: undefined,
            customLayoutAsync: undefined,
            maxNumberOfFailures: config.maxNumberOfFailures,
            disableUnfurl: config.disableUnfurl,
            summaryResults,
        });
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(webhookResult, null, 2));
        console.log('✅ Results sent to Slack');
        process.exit(0);
    }
});
program.parse();
async function sendResultsUsingBot({ resultSummary, slackClient, config, }) {
    if (config.slackLogLevel === web_api_1.LogLevel.DEBUG) {
        console.log({ config });
    }
    if (resultSummary.failures.length === 0
        && config.sendResults === 'on-failure') {
        console.log('⏩ Slack CLI reporter - no failures found');
        return true;
    }
    let summaryResults = resultSummary;
    const meta = replaceEnvVars(config.meta);
    summaryResults = { ...resultSummary, meta };
    if (config.sendUsingBot) {
        const result = await slackClient.sendMessage({
            options: {
                channelIds: config.sendUsingBot.channels,
                customLayout: await attemptToImportLayout(config.customLayout?.source, config.customLayout?.functionName),
                customLayoutAsync: await attemptToImportLayout(config.customLayoutAsync?.source, config.customLayoutAsync?.functionName),
                maxNumberOfFailures: config.maxNumberOfFailures,
                disableUnfurl: config.disableUnfurl,
                summaryResults,
                showInThread: config.showInThread,
            },
        });
        if (config.showInThread && resultSummary.failures.length > 0) {
            for (let i = 0; i < result.length; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await slackClient.attachDetailsToThread({
                    channelIds: [result[i].channel],
                    ts: result[i].ts,
                    summaryResults: resultSummary,
                    maxNumberOfFailures: config.maxNumberOfFailures,
                });
            }
        }
        if (result.filter((r) => !r.outcome.includes('✅ Message sent to')).length
            !== 0) {
            return false;
        }
        return true;
    }
    throw new Error('sendUsingBot config is not set');
}
async function attemptToImportLayout(source, functionName) {
    if (source && functionName) {
        try {
            const importPath = path_1.default.resolve(source);
            const layout = await Promise.resolve(`${importPath}`).then(s => __importStar(require(s)));
            if (layout.default[functionName]) {
                return layout.default[functionName];
            }
            console.error(`Function [${functionName}] was not found in [${source}]`);
        }
        catch (error) {
            console.error(error);
        }
    }
    return undefined;
}
function replaceEnvVars(originalMeta) {
    const newMeta = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const m of originalMeta) {
        let metaValue = m.value;
        if (m.value.startsWith('__ENV')) {
            const environmentVarName = m.value.replace('__ENV_', '');
            if (process.env[environmentVarName]) {
                metaValue = process.env[environmentVarName];
            }
            else {
                const warningMessage = `❌ Environment variable [${environmentVarName}] was not set.
        This variable was found in the [meta] section of the config file, ensure the variable is set in your environment.`;
                console.log(warningMessage);
                metaValue = warningMessage;
            }
        }
        newMeta.push({ key: m.key, value: metaValue });
    }
    return newMeta;
}
//# sourceMappingURL=cli.js.map