/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { FullConfig, Reporter, Suite } from '@playwright/test/reporter';
import ResultsParser from './ResultsParser';
import SlackClient from './SlackClient';

class SlackReporter implements Reporter {
  private suite!: Suite;

  private sendResults: 'always' | 'on-failure' | 'off' = 'on-failure';

  private slackChannels: string[] = [];

  private meta: Array<{ key: string, value: string }> = [];

  onBegin(config: FullConfig, suite: Suite) {
    const slackReporterConfig = config.reporter.filter(
      (f) => f[0].toLowerCase().includes('slackreporter') || f[1]?.toLowerCase().includes('slackreporter'),
    );
    this.suite = suite;
    this.meta = slackReporterConfig[0][1].meta || [];
    this.sendResults = slackReporterConfig[0][1].sendResults;
    if (slackReporterConfig[0][1].channels) {
      this.slackChannels = slackReporterConfig[0][1].channels;
    } else {
      throw new Error('Slack channel(s) was not provided in the config');
    }
  }

  async onEnd() {
    if (this.sendResults === 'off') {
      // eslint-disable-next-line no-console
      console.log('⏩ Slack reporter is disabled');
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

    const slackClient = new SlackClient();
    await slackClient.sendMessage({
      channelIds: this.slackChannels,
      summaryResults: resultSummary,
    });
  }
}
export default SlackReporter;
