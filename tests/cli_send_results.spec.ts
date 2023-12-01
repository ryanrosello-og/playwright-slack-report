import { test } from '@playwright/test';

test.describe('CLI app - pre-check', () => {
  test('throws an error when the JSON results file does not exist', async ({}) => {
    //
  });
  test('throws an error when the config file does not exist', async ({}) => {
    //
  });
  test('throws an error when both sendUsingWebhook and sendUsingBot are defined', async ({}) => {
    //
  });
  test('ensures the env variable [SLACK_BOT_USER_OAUTH_TOKEN] is set', async ({}) => {
    //
  });
  test('ensures the webhook ulr is specified', async ({}) => {
    //
  });
  test('ensures the customLayout settings are correct', async ({}) => {
    //
  });
  test('ensures the customLayoutAsync settings are correct', async ({}) => {
    //
  });
});
