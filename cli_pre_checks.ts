import { existsSync, PathLike, readFileSync } from 'fs';
import path from 'path';
import { ICliConfig, ZodCliSchema } from './cli_schema';

const doPreChecks = async (
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

  if (config.sendUsingWebhook && config.sendUsingBot) {
    return {
      status: 'error',
      message:
        'It is not possible to use both sendUsingWebhook and sendUsingBot, choose a single method',
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

  if (config.sendUsingBot && config.sendUsingBot.channels?.length === 0) {
    return {
      status: 'error',
      message: 'Missing the channels in the config file',
    };
  }

  if (config.sendUsingWebhook && !config.sendUsingWebhook.webhookUrl) {
    return {
      status: 'error',
      message: 'Missing the webhookUrl in the config file',
    };
  }

  if (
    config.customLayout?.functionName
    && !fileExists(config.customLayout.source)
  ) {
    return {
      status: 'error',
      message:
        'customLayout is not configured correctly - both functionName and source are required',
    };
  }

  if (
    config.customLayoutAsync?.functionName
    && !fileExists(config.customLayoutAsync.source)
  ) {
    return {
      status: 'error',
      message:
        'customLayoutAsync is not configured correctly - both functionName and source are required',
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
