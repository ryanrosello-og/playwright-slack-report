/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { FullConfig, Reporter, Suite } from '@playwright/test/reporter';
import { LogLevel, WebClient } from '@slack/web-api';
import ResultsParser from './ResultsParser';
import SlackClient from './SlackClient';

class SlackReporter implements Reporter {
  private suite!: Suite;

  private sendResults: 'always' | 'on-failure' | 'off' = 'on-failure';

  private slackChannels: string[] = [];

  private meta: Array<{ key: string, value: string }> = [];

  private customLayout: Function | undefined;

  onBegin(config: FullConfig, suite: Suite): void {

    // TODO: implement better fetching of the config
    const slackReporterConfig = config.reporter.filter(
      (f) => f[0].toLowerCase().includes('slackreporter') || f[1]?.toLowerCase().includes('slackreporter'),
    );
    this.suite = suite;
    this.meta = slackReporterConfig[0][1].meta || [];
    this.sendResults = slackReporterConfig[0][1].sendResults;
    this.customLayout = slackReporterConfig[0][1].layout;
    this.slackChannels = slackReporterConfig[0][1].channels;
  }

  async onEnd() {
    if(!SlackReporter.okToProceed()) {

    }
    if (this.sendResults === 'off') {
      // eslint-disable-next-line no-console
      console.log('⏩ Slack reporter is disabled');
      return;
    }

    if (!process.env.SLACK_BOT_USER_OAUTH_TOKEN) {
      console.log('❌ SLACK_BOT_USER_OAUTH_TOKEN was not found');
      return;
    }

    if (this.slackChannels.length === 0) {
      console.log('❌ Slack channel(s) was not provided in the config');
      return;
    }

    const resultsParser = new ResultsParser(this.suite);
    await resultsParser.parse();
    const resultSummary = await resultsParser.getParsedResults();
    resultSummary.meta = this.meta;
    if (this.sendResults === 'on-failure' && resultSummary.failures.length === 0) {
      // eslint-disable-next-line no-console
      console.log('⏩ Slack reporter - no failures found');
      return;
    }

    const slackClient = new SlackClient(new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
      logLevel: LogLevel.DEBUG,
    }))
    await slackClient.sendMessage({
      channelIds: this.slackChannels,
      summaryResults: resultSummary,
      customLayout: this.customLayout,
    });
  }


  // TODO: implement 
  static okToProceed() {

  }
}
export default SlackReporter;
