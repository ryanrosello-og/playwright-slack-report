#!/usr/bin/env node
import { Command } from 'commander';
import { existsSync, PathLike } from 'fs';
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
      config: preCheckResult.configPath!,
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

async function sendResults({
  resultsParser,
  slackClient,
  filePath,
  config,
}: {
  resultsParser: ResultsParser;
  slackClient: SlackClient;
  filePath: string;
  config: any;
}): Promise<true> {
  if (config.slackLogLevel === LogLevel.DEBUG) {
    console.log({ config });
  }
  const resultSummary = await resultsParser.parseFromJsonFile(filePath);

  const result = await slackClient.sendMessage({
    options: {
      channelIds: ['qa-automation'],
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: 5,
      disableUnfurl: false,
      summaryResults: resultSummary,
      showInThread: false,
    },
  });

  console.log('🚀 --------------------------------------------🚀');
  console.log('🚀 ~ file: cli.ts:35 ~ main ~ result:', result);
  console.log('🚀 --------------------------------------------🚀');
  return true;
}
