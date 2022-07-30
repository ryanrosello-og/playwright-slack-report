/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { FullConfig, Reporter, Suite } from '@playwright/test/reporter';
import ResultsParser from './ResultsParser';
import SlackClient from './SlackClient';

class SlackReporter implements Reporter {
  private suite!: Suite;

  onBegin(config: FullConfig, suite: Suite) {
    this.suite = suite;
  }

  async onEnd() {
    const resultsParser = new ResultsParser(this.suite);
    await resultsParser.parse();
    const resultSummary = await resultsParser.getParsedResults();
    console.log(resultSummary);
    const slackClient = new SlackClient();
    await slackClient.sendMessage('zeb', resultSummary);
  }
}
export default SlackReporter;
