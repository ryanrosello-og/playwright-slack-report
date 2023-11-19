// get path to json
// ensure path exist
// ensure json is parsable

import { WebClient, LogLevel } from '@slack/web-api';
import ResultsParser from './src/ResultsParser';
import SlackClient from './src/SlackClient';

async function main(): Promise<void> {
  const filePath = 'tests_data.json';
  const resultsParser = new ResultsParser();
  const resultSummary = await resultsParser.parseFromJsonFile(filePath);
  const slackClient = new SlackClient(
    new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
      logLevel: LogLevel.DEBUG,
      agent: undefined,
    }),
  );

  const result = await slackClient.sendMessage({
    options: {
      channelIds: ['qa-automation'],
      customLayout: undefined,
      customLayoutAsync: undefined,
      maxNumberOfFailures: 5,
      disableUnfurl: false,
      summaryResults: resultSummary,
      showInThread: true,
    },
  });

  console.log('🚀 --------------------------------------------🚀');
  console.log('🚀 ~ file: cli.ts:35 ~ main ~ result:', result);
  console.log('🚀 --------------------------------------------🚀');
}

// TODO:
// unit tests for parseFromJsonFile
// incorrect #failures
// need to recursively handle test suites

(async () => main())();
