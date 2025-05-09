import { existsSync, PathLike, readFileSync } from 'fs';
import path from 'path';
import { ICliConfig, ZodCliSchema } from './cli_schema';

export const doPreChecks = async (
  jsonResultsPath: string,
  configFile: string,
): Promise<{
  status: 'error' | 'ok';
  message?: string;
  jsonPath?: string;
  configPath?: string;
  config?: ICliConfig;
}> => {
  if (!fileExists(jsonResultsPath)) {
    return {
      status: 'error',
      message: `JSON results file does not exist: ${jsonResultsPath}:
      Use --json-results <path> e.g. --json-results="./results.json"`,
    };
  }

  if (!fileExists(configFile)) {
    return {
      status: 'error',
      message: `Config file does not exist: ${configFile}`,
    };
  }

  const parseResult = { success: false, error: undefined, data: undefined };
  let config: ICliConfig;
  try {
    config = getConfig(configFile);
    parseResult.data = ZodCliSchema.parse(config);
    parseResult.success = true;
  } catch (error) {
    parseResult.success = false;
    parseResult.error = error;
  }

  if (!parseResult.success) {
    return {
      status: 'error',
      message: `Config file is not valid: ${
        parseResult.error.message ?? JSON.stringify(parseResult.error, null, 2)
      }`,
    };
  }

  if (config.customLayout?.source && !fileExists(config.customLayout?.source)) {
    return {
      status: 'error',
      message: `Custom layout was not found in path: ${config.customLayout.source}`,
    };
  }

  if (config.sendUsingWebhook && config.sendUsingBot) {
    return {
      status: 'error',
      message:
        'It is not possible to use both sendUsingWebhook and sendUsingBot, choose a single method',
    };
  }

  if (config.sendUsingWebhook && config.showInThread) {
    return {
      status: 'error',
      message:
        'The showInThread feature is only supported when using sendUsingBot is configured',
    };
  }

  if (config.sendUsingWebhook && config.sendCustomBlocksInThreadAfterIndex) {
    return {
      status: 'error',
      message:
        'The sendCustomBlocksInThreadAfterIndex feature is only supported when using sendUsingBot is configured',
    };
  }

  if (!config.sendUsingWebhook && !config.sendUsingBot) {
    return {
      status: 'error',
      message:
        'You must specify either sendUsingWebhook or sendUsingBot in the config file',
    };
  }

  if (config.sendUsingBot && !process.env.SLACK_BOT_USER_OAUTH_TOKEN) {
    return {
      status: 'error',
      message: 'Missing the SLACK_BOT_USER_OAUTH_TOKEN env variable',
    };
  }

  return {
    status: 'ok',
    jsonPath: path.resolve(jsonResultsPath),
    configPath: path.resolve(configFile),
    config: parseResult.data,
  };
};

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
export default doPreChecks;
