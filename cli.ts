#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import { existsSync, PathLike, readFileSync } from 'fs';
import path from 'path';
import { LogLevel, WebClient } from '@slack/web-api';
import packageInfo from './package.json';
import ResultsParser from './src/ResultsParser';
import SlackClient from './src/SlackClient';

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
    if (preCheckResult.status === 'error') {
      console.error(preCheckResult.message);
      process.exit(1);
    }
    const resultsParser = new ResultsParser();
    const slackClient = new SlackClient(
      new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
        logLevel: LogLevel.DEBUG,
        agent: undefined,
      }),
    );
    await sendResults({
      resultsParser,
      slackClient,
      filePath: preCheckResult.jsonPath!,
      configPath: preCheckResult.configPath!,
    });
  });

program.parse();

async function doPreChecks(
  jsonResultsPath: string,
  configFile: string,
): Promise<{
  status: 'error' | 'ok';
  message?: string;
  jsonPath?: string;
  configPath?: string;
}> {
  if (!fileExists(jsonResultsPath)) {
    return {
      status: 'error',
      message: `JSON results file does not exist: ${jsonResultsPath}`,
    };
  }

  if (!fileExists(configFile)) {
    return {
      status: 'error',
      message: `Config file does not exist: ${configFile}`,
    };
  }

  const config = getConfig(configFile);
  if (config.sendVia.method === 'webhook' && !config.sendVia.webhookUrl) {
    return {
      status: 'error',
      message: 'Missing the webhookUrl in the config file',
    };
  }

  if (
    config.sendVia.method === 'slack-bot-oauth'
    && !process.env.SLACK_BOT_USER_OAUTH_TOKEN
  ) {
    return {
      status: 'error',
      message: 'Missing the SLACK_BOT_USER_OAUTH_TOKEN env variable',
    };
  }

  if (
    config.sendVia.method === 'slack-bot-oauth'
    && config.sendVia.channels?.length === 0
  ) {
    return {
      status: 'error',
      message: 'Missing the channels in the config file',
    };
  }

  if (
    !config.customLayout?.functionName
    || !fileExists(config.customLayout.source)
  ) {
    return {
      status: 'error',
      message:
        'customLayout is not configured correctly - both functionName and source are required',
    };
  }

  if (
    !config.customLayoutAsync?.functionName
    || !fileExists(config.customLayoutAsync.source)
  ) {
    return {
      status: 'error',
      message:
        'customLayoutAsync is not configured correctly - both functionName and source are required',
    };
  }

  if (config.maxNumberOfFailures < 0) {
    return {
      status: 'error',
      message: 'maxNumberOfFailures must be a positive number',
    };
  }

  if (typeof config.disableUnfurl !== 'boolean') {
    return {
      status: 'error',
      message: 'disableUnfurl must be a boolean',
    };
  }

  if (typeof config.showInThread !== 'boolean') {
    return {
      status: 'error',
      message: 'showInThread must be a boolean',
    };
  }
  return {
    status: 'ok',
    jsonPath: path.resolve(jsonResultsPath),
    configPath: path.resolve(configFile),
  };
}

function fileExists(filePath: string): boolean {
  let absolutePath: PathLike;
  try {
    absolutePath = path.resolve(filePath);
  } catch (error) {
    return false;
  }
  return existsSync(absolutePath);
}

function getConfig(configPath: string): ICliConfig {
  const config = readFileSync(path.resolve(path.resolve(configPath)), 'utf-8');
  return JSON.parse(config);
}

async function sendResults({
  resultsParser,
  slackClient,
  filePath,
  configPath,
}: {
  resultsParser: ResultsParser;
  slackClient: SlackClient;
  filePath: string;
  configPath: string;
}): Promise<true> {
  const config = getConfig(configPath);
  if (config.slackLogLevel === LogLevel.DEBUG) {
    console.log({ config });
  }
  const resultSummary = await resultsParser.parseFromJsonFile(filePath);

  const result = await slackClient.sendMessage({
    options: {
      channelIds: ['qa-automation'],
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: config.maxNumberOfFailures,
      disableUnfurl: config.disableUnfurl,
      summaryResults: resultSummary,
      showInThread: config.showInThread,
    },
  });

  console.log('🚀 --------------------------------------------🚀');
  console.log('🚀 ~ file: cli.ts:35 ~ main ~ result:', result);
  console.log('🚀 --------------------------------------------🚀');
  return true;
}

interface ICliConfig {
  sendVia: {
    method: 'slack-bot-oauth' | 'webhook';
    channels?: {
      id: string;
      sendResults: 'always' | 'on-failure';
    }[];
    webhookUrl?: string;
  };
  slackLogLevel: LogLevel;
  customLayout?: {
    functionName: string;
    source: string;
  };
  customLayoutAsync?: {
    functionName: string;
    source: string;
  };
  maxNumberOfFailures: number;
  disableUnfurl: boolean;
  showInThread: boolean;
}
