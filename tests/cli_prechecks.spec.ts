import { expect, test } from '@playwright/test';
import path from 'path';
import doPreChecks from '../src/cli/cli_pre_checks';

test.describe('CLI app - pre-check', () => {
  test.beforeAll(async ({}) => {});

  test('throws an error when the JSON results file does not exist', async ({}) => {
    const result = await doPreChecks(
      'does-not-exist.json',
      'does-not-exist.json',
    );
    expect(result.status).toEqual('error');
    expect(result.message).toContain('JSON results file does not exist');
  });

  test('throws an error when the config file does not exist', async ({}) => {
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    const result = await doPreChecks(validTestResults, 'does-not-exist.json');
    expect(result.status).toEqual('error');
    expect(result.message).toContain('Config file does not exist');
  });

  test('throws an error when both sendUsingBot and sendUsingWebhook defined', async ({}) => {
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    const invalidConfig = path.join(
      __dirname,
      'test_data',
      'invalid_cli_config_both_bot_and_webhook_defined.json',
    );
    const result = await doPreChecks(validTestResults, invalidConfig);
    expect(result.status).toEqual('error');
    expect(result.message).toContain('It is not possible to use both sendUsingWebhook and sendUsingBot, choose a single method');
  });

  test('throws an error when missing both sendUsingBot and sendUsingWebhook keys', async ({}) => {
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    const invalidConfig = path.join(
      __dirname,
      'test_data',
      'invalid_cli_config_missing_both_bot_and_webhook.json',
    );
    const result = await doPreChecks(validTestResults, invalidConfig);
    expect(result.status).toEqual('error');
    expect(result.message).toContain('You must specify either sendUsingWebhook or sendUsingBot in the config file');
  });

  test('zod parsing throws an error when cli config misconfigured', async ({}) => {
    const invalidConfig = path.join(
      __dirname,
      'test_data',
      'invalid_cli_config_fails_zod_parsing.json',
    );
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    const result = await doPreChecks(validTestResults, invalidConfig);
    expect(result.status).toEqual('error');
    expect(result.message).toEqual(`Config file is not valid: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "sendUsingWebhook",
      "webhookUrl"
    ],
    "message": "Required"
  }
]`);
  });

  test('ensures the env variable [SLACK_BOT_USER_OAUTH_TOKEN] is set', async ({}) => {
    const validConfig = path.join(
      __dirname,
      'test_data',
      'valid_cli_config.json',
    );
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
    const result = await doPreChecks(validTestResults, validConfig);
    expect(result.status).toEqual('error');
    expect(result.message).toEqual('Missing the SLACK_BOT_USER_OAUTH_TOKEN env variable');
  });

  test('provides config value when all pre-checks are valid', async ({}) => {
    const validConfig = path.join(
      __dirname,
      'test_data',
      'valid_cli_config.json',
    );
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    process.env.SLACK_BOT_USER_OAUTH_TOKEN = 'test';
    const result = await doPreChecks(validTestResults, validConfig);
    expect(result.status).toEqual('ok');
  });
});
