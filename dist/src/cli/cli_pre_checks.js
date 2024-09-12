"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.doPreChecks = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const cli_schema_1 = require("./cli_schema");
const doPreChecks = async (jsonResultsPath, configFile) => {
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
    let config;
    try {
        config = getConfig(configFile);
        parseResult.data = cli_schema_1.ZodCliSchema.parse(config);
        parseResult.success = true;
    }
    catch (error) {
        parseResult.success = false;
        parseResult.error = error;
    }
    if (!parseResult.success) {
        return {
            status: 'error',
            message: `Config file is not valid: ${parseResult.error.message ?? JSON.stringify(parseResult.error, null, 2)}`,
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
            message: 'It is not possible to use both sendUsingWebhook and sendUsingBot, choose a single method',
        };
    }
    if (config.sendUsingWebhook && config.showInThread) {
        return {
            status: 'error',
            message: 'The showInThread feature is only supported when using sendUsingBot is configured',
        };
    }
    if (!config.sendUsingWebhook && !config.sendUsingBot) {
        return {
            status: 'error',
            message: 'You must specify either sendUsingWebhook or sendUsingBot in the config file',
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
        jsonPath: path_1.default.resolve(jsonResultsPath),
        configPath: path_1.default.resolve(configFile),
        config: parseResult.data,
    };
};
exports.doPreChecks = doPreChecks;
function fileExists(filePath) {
    let absolutePath;
    try {
        absolutePath = path_1.default.resolve(filePath);
    }
    catch (error) {
        return false;
    }
    return (0, fs_1.existsSync)(absolutePath);
}
function getConfig(configPath) {
    const config = (0, fs_1.readFileSync)(path_1.default.resolve(path_1.default.resolve(configPath)), 'utf-8');
    return JSON.parse(config);
}
exports.default = exports.doPreChecks;
//# sourceMappingURL=cli_pre_checks.js.map