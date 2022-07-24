/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import { FullConfig, Reporter, Suite } from '@playwright/test/reporter';
import ResultsParser from './ResultsParser';

class SlackReporter implements Reporter {
  private suite!: Suite;

  onBegin(config: FullConfig, suite: Suite) {
    this.suite = suite;
  }

  async onEnd() {
    const resultsParser = new ResultsParser(this.suite);
    await resultsParser.parse();
    const r = await resultsParser.getParsedResults();
    console.log(r);
  }
}
export default SlackReporter;
