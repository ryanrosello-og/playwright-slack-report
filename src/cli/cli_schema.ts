import { z } from 'zod';
import { LogLevel } from '@slack/web-api';

const LogLevelEnum = z.nativeEnum(LogLevel);
export const ZodCliSchema = z.object({
  sendResults: z.enum(['always', 'on-failure', 'on-flaky']),
  sendUsingBot: z
    .object({
      channels: z.array(z.string()).nonempty(),
    })
    .optional(),
  sendUsingWebhook: z
    .object({
      webhookUrl: z.string().url(),
    })
    .optional(),
  customLayout: z
    .object({
      functionName: z.string(),
      source: z.string(),
    })
    .optional(),
  customLayoutAsync: z
    .object({
      functionName: z.string(),
      source: z.string(),
    })
    .optional(),
  slackLogLevel: LogLevelEnum,
  maxNumberOfFailures: z.number().default(5),
  maxNumberOfFlakyTests: z.number().int().nonnegative().default(10),
  disableUnfurl: z.boolean().default(false),
  showInThread: z.boolean().default(false),
  proxy: z.string().url().optional(),
  meta: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  sendCustomBlocksInThreadAfterIndex: z.number().optional(),
});

export interface ICliConfig {
  sendResults: 'always' | 'on-failure' | 'on-flaky';
  sendUsingBot?: {
    channels: string[];
  };
  sendUsingWebhook?: {
    webhookUrl: string;
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
  maxNumberOfFlakyTests?: number;
  disableUnfurl: boolean;
  showInThread: boolean;
  proxy?: string;
  meta?: Array<{ key: string; value: string }>;
  sendCustomBlocksInThreadAfterIndex?: number;
}
