#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import { LogLevel, WebClient } from '@slack/web-api';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { IncomingWebhook } from '@slack/webhook';
import packageInfo from './package.json';
import ResultsParser from './src/ResultsParser';
import SlackClient from './src/SlackClient';
import doPreChecks from './cli_pre_checks';
import { ICliConfig } from './cli_schema';
import { SummaryResults } from './src';
import SlackWebhookClient from './src/SlackWebhookClient';

const program = new Command();

program
  .name(packageInfo.name)
  .version(packageInfo.version)
  .description('📦 Send Playwright json results to directly Slack ')
  .option(
    '-c, --config <path>',
    'Configuration file for the CLI app e.g ./config.json',
  )
  .option(
    '-j, --json-results <path>',
    'Generated Playwright json results file e.g. ./results.json',
  )
  .action(async (options) => {
    console.log({ options });
    const preCheckResult = await doPreChecks(
      options.jsonResults,
      options.config,
    );
    const config: ICliConfig = preCheckResult.config!;
    if (preCheckResult.status === 'error') {
      console.error(preCheckResult.message);
      process.exit(1);
    }
    const agent = config.proxy ? new HttpsProxyAgent(config.proxy) : undefined;

    const resultsParser = new ResultsParser();
    const resultSummary = await resultsParser.parseFromJsonFile(
      preCheckResult.jsonPath!,
    );
    if (config.sendUsingBot) {
      const slackClient = new SlackClient(
        new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
          logLevel: LogLevel.DEBUG,
          agent,
        }),
      );
      await sendResultsUsingBot({
        resultSummary,
        slackClient,
        config,
      });
    }

    if (config.sendUsingWebhook) {
      const webhook = new IncomingWebhook(config.sendUsingWebhook.webhookUrl, { agent });
      const slackWebhookClient = new SlackWebhookClient(webhook);
      const webhookResult = await slackWebhookClient.sendMessage({
        customLayout: undefined,
        customLayoutAsync: undefined,
        maxNumberOfFailures: config.maxNumberOfFailures,
        disableUnfurl: config.disableUnfurl,
        summaryResults: resultSummary,
      });
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(webhookResult, null, 2));
    }
  });

program.parse();

async function sendResultsUsingBot({
  resultSummary,
  slackClient,
  config,
}: {
  resultSummary: SummaryResults;
  slackClient: SlackClient;
  config: ICliConfig;
}): Promise<true> {
  if (config.slackLogLevel === LogLevel.DEBUG) {
    console.log({ config });
  }
  if (
    resultSummary.failures.length === 0
    && config.sendResults === 'on-failure'
  ) {
    console.log('⏩ Slack CLI reporter - no failures found');
    return true;
  }

  if (config.sendUsingBot) {
    const result = await slackClient.sendMessage({
      options: {
        channelIds: config.sendUsingBot.channels.map((c) => c.id),
        customLayout: undefined,
        customLayoutAsync: undefined,
        maxNumberOfFailures: config.maxNumberOfFailures,
        disableUnfurl: config.disableUnfurl,
        summaryResults: resultSummary,
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
    return true;
  }
  throw new Error('sendUsingBot config is not set');
}
