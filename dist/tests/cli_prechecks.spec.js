"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const cli_pre_checks_1 = __importDefault(require("../src/cli/cli_pre_checks"));
const validTestResults = path_1.default.join(__dirname, 'test_data', 'valid_test_results.json');
test_1.test.describe('CLI app - pre-check', () => {
    test_1.test.beforeAll(async ({}) => { });
    (0, test_1.test)('throws an error when the JSON results file does not exist', async ({}) => {
        const result = await (0, cli_pre_checks_1.default)('does-not-exist.json', 'does-not-exist.json');
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toContain('JSON results file does not exist');
    });
    (0, test_1.test)('throws an error when the config file does not exist', async ({}) => {
        const result = await (0, cli_pre_checks_1.default)(validTestResults, 'does-not-exist.json');
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toContain('Config file does not exist');
    });
    (0, test_1.test)('throws an error when both sendUsingBot and sendUsingWebhook defined', async ({}) => {
        const invalidConfig = path_1.default.join(__dirname, 'test_data', 'invalid_cli_config_both_bot_and_webhook_defined.json');
        const result = await (0, cli_pre_checks_1.default)(validTestResults, invalidConfig);
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toContain('It is not possible to use both sendUsingWebhook and sendUsingBot, choose a single method');
    });
    (0, test_1.test)('throws an error when the custom layout js file cannot be found', async ({}) => {
        const invalidConfig = path_1.default.join(__dirname, 'test_data', 'invalid_cli_config_custom_layout_not_found.json');
        const result = await (0, cli_pre_checks_1.default)(validTestResults, invalidConfig);
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toContain('Custom layout was not found in path: ./custom_block/fail/cli_block_with_meta.ts');
    });
    (0, test_1.test)('throws an error when both sendUsingWebhook and showInThread is true', async ({}) => {
        const invalidConfig = path_1.default.join(__dirname, 'test_data', 'invalid_cli_config_showInThread_enable_for_webhook.json');
        const result = await (0, cli_pre_checks_1.default)(validTestResults, invalidConfig);
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toContain('The showInThread feature is only supported when using sendUsingBot is configured');
    });
    (0, test_1.test)('throws an error when missing both sendUsingBot and sendUsingWebhook keys', async ({}) => {
        const invalidConfig = path_1.default.join(__dirname, 'test_data', 'invalid_cli_config_missing_both_bot_and_webhook.json');
        const result = await (0, cli_pre_checks_1.default)(validTestResults, invalidConfig);
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toContain('You must specify either sendUsingWebhook or sendUsingBot in the config file');
    });
    (0, test_1.test)('zod parsing throws an error when cli config misconfigured', async ({}) => {
        const invalidConfig = path_1.default.join(__dirname, 'test_data', 'invalid_cli_config_fails_zod_parsing.json');
        const result = await (0, cli_pre_checks_1.default)(validTestResults, invalidConfig);
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toEqual(`Config file is not valid: [
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
    (0, test_1.test)('ensures the env variable [SLACK_BOT_USER_OAUTH_TOKEN] is set', async ({}) => {
        const validConfig = path_1.default.join(__dirname, 'test_data', 'valid_cli_config.json');
        delete process.env.SLACK_BOT_USER_OAUTH_TOKEN;
        const result = await (0, cli_pre_checks_1.default)(validTestResults, validConfig);
        (0, test_1.expect)(result.status).toEqual('error');
        (0, test_1.expect)(result.message).toEqual('Missing the SLACK_BOT_USER_OAUTH_TOKEN env variable');
    });
    (0, test_1.test)('provides config value when all pre-checks are valid', async ({}) => {
        const validConfig = path_1.default.join(__dirname, 'test_data', 'valid_cli_config.json');
        process.env.SLACK_BOT_USER_OAUTH_TOKEN = 'test';
        const result = await (0, cli_pre_checks_1.default)(validTestResults, validConfig);
        (0, test_1.expect)(result.status).toEqual('ok');
    });
});
//# sourceMappingURL=cli_prechecks.spec.js.map