"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodCliSchema = void 0;
const zod_1 = require("zod");
const web_api_1 = require("@slack/web-api");
const LogLevelEnum = zod_1.z.nativeEnum(web_api_1.LogLevel);
exports.ZodCliSchema = zod_1.z.object({
    sendResults: zod_1.z.enum(['always', 'on-failure']),
    sendUsingBot: zod_1.z
        .object({
        channels: zod_1.z.array(zod_1.z.string()).nonempty(),
    })
        .optional(),
    sendUsingWebhook: zod_1.z
        .object({
        webhookUrl: zod_1.z.string().url(),
    })
        .optional(),
    customLayout: zod_1.z
        .object({
        functionName: zod_1.z.string(),
        source: zod_1.z.string(),
    })
        .optional(),
    customLayoutAsync: zod_1.z
        .object({
        functionName: zod_1.z.string(),
        source: zod_1.z.string(),
    })
        .optional(),
    slackLogLevel: LogLevelEnum,
    maxNumberOfFailures: zod_1.z.number().default(5),
    disableUnfurl: zod_1.z.boolean().default(false),
    showInThread: zod_1.z.boolean().default(false),
    proxy: zod_1.z.string().url().optional(),
    meta: zod_1.z.array(zod_1.z.object({ key: zod_1.z.string(), value: zod_1.z.string() })).optional(),
});
//# sourceMappingURL=cli_schema.js.map