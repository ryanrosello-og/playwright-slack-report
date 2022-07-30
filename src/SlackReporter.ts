/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { FullConfig, Reporter, Suite } from '@playwright/test/reporter';
import ResultsParser from './ResultsParser';
import SlackClient from './SlackClient';

class SlackReporter implements Reporter {
  private suite!: Suite;

  private config!: FullConfig;

  private enabled: boolean | undefined;

  private slackChannels: string[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    const slackReporterConfig = config.reporter.filter(
      (f) => f[0].toLowerCase().includes('slackreporter') || f[1]?.toLowerCase().includes('slackreporter'),
    );
    this.suite = suite;
    this.config = config;
    this.enabled = slackReporterConfig[0][1].enabled || false;
    if (slackReporterConfig[0][1].channels) {
      this.slackChannels = slackReporterConfig[0][1].channels;
    } else {
      throw new Error('Slack channel(s) was not provided in the config');
    }
  }

  async onEnd() {
    if (!this.enabled) {
      // eslint-disable-next-line no-console
      console.log('⏩ Slack reporter is disabled');
      return;
    }
    const resultsParser = new ResultsParser(this.suite);
    await resultsParser.parse();
    const resultSummary = await resultsParser.getParsedResults();
    const slackClient = new SlackClient();
    await slackClient.sendMessage(this.slackChannels, resultSummary);
  }
}
export default SlackReporter;
