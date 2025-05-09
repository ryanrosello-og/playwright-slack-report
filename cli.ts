#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import { LogLevel, WebClient } from '@slack/web-api';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { IncomingWebhook } from '@slack/webhook';
import path from 'path';
import ResultsParser from './src/ResultsParser';
import SlackClient from './src/SlackClient';
import doPreChecks from './src/cli/cli_pre_checks';
import { ICliConfig } from './src/cli/cli_schema';
import { Meta, SummaryResults } from './src';
import SlackWebhookClient from './src/SlackWebhookClient';

const program = new Command();

program
  .name('playwright-slack-report - cli')
  .version('1.0.0')
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
    const preCheckResult = await doPreChecks(
      options.jsonResults,
      options.config,
    );
    const config: ICliConfig = preCheckResult.config!;
    if (preCheckResult.status === 'error') {
      console.error(`❌ ${preCheckResult.message}`);
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
          logLevel: config.slackLogLevel,
          agent,
        }),
      );
      const success = await sendResultsUsingBot({
        resultSummary,
        slackClient,
        config,
      });
      if (!success) {
        console.error('❌ Failed to send results to Slack');
        process.exit(1);
      } else {
        console.log('✅ Results sent to Slack');
        process.exit(0);
      }
    }

    if (config.sendUsingWebhook) {
      const webhook = new IncomingWebhook(config.sendUsingWebhook.webhookUrl, {
        agent,
      });
      const slackWebhookClient = new SlackWebhookClient(webhook);
      let summaryResults = resultSummary;
      const meta = replaceEnvVars(config.meta);
      summaryResults = { ...resultSummary, meta };
      const webhookResult = await slackWebhookClient.sendMessage({
        customLayout: await attemptToImportLayout(
          config.customLayout?.source,
          config.customLayout?.functionName,
        ),
        customLayoutAsync: await attemptToImportLayout(
          config.customLayoutAsync?.source,
          config.customLayoutAsync?.functionName,
        ),
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

async function sendResultsUsingBot({
  resultSummary,
  slackClient,
  config,
}: {
  resultSummary: SummaryResults;
  slackClient: SlackClient;
  config: ICliConfig;
}): Promise<boolean> {
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
  let summaryResults = resultSummary;
  const meta = replaceEnvVars(config.meta);
  summaryResults = { ...resultSummary, meta };
  if (config.sendUsingBot) {
    const result = await slackClient.sendMessage({
      options: {
        channelIds: config.sendUsingBot.channels,
        customLayout: await attemptToImportLayout(
          config.customLayout?.source,
          config.customLayout?.functionName,
        ),
        customLayoutAsync: await attemptToImportLayout(
          config.customLayoutAsync?.source,
          config.customLayoutAsync?.functionName,
        ),
        maxNumberOfFailures: config.maxNumberOfFailures,
        disableUnfurl: config.disableUnfurl,
        summaryResults,
        showInThread: config.showInThread,
        sendCustomBlocksInThreadAfterIndex: config.sendCustomBlocksInThreadAfterIndex,
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

    if (
      result.filter((r) => !r.outcome.includes('✅ Message sent to')).length
      !== 0
    ) {
      return false;
    }
    return true;
  }
  throw new Error('sendUsingBot config is not set');
}

async function attemptToImportLayout(source: string, functionName: string) {
  if (source && functionName) {
    try {
      const importPath = path.resolve(source);
      const layout = await import(importPath);
      if (layout.default[functionName]) {
        return layout.default[functionName];
      }
      console.error(`Function [${functionName}] was not found in [${source}]`);
    } catch (error) {
      console.error(error);
    }
  }
  return undefined;
}

function replaceEnvVars(originalMeta: Meta) {
  const newMeta: Meta = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const m of originalMeta) {
    let metaValue = m.value;
    if (m.value.startsWith('__ENV')) {
      const environmentVarName = m.value.replace('__ENV_', '');
      if (process.env[environmentVarName]) {
        metaValue = process.env[environmentVarName];
      } else {
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
