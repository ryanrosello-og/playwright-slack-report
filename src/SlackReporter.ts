/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import {
  FullConfig, Reporter, Suite, TestCase, TestResult,
} from '@playwright/test/reporter';
import { LogLevel, WebClient } from '@slack/web-api';

import ResultsParser from './ResultsParser';
import SlackClient from './SlackClient';

class SlackReporter implements Reporter {
  private suite!: Suite;

  private sendResults: 'always' | 'on-failure' | 'off' = 'on-failure';

  private slackChannels: string[] = [];

  private meta: Array<{ key: string; value: string }> = [];

  private customLayout: Function | undefined;

  private customLayoutAsync: Function | undefined;

  private maxNumberOfFailuresToShow: number;

  private resultsParser: ResultsParser;

  logs: string[] = [];

  onBegin(fullConfig: FullConfig, suite: Suite): void {
    this.suite = suite;
    this.logs = [];
    const slackReporterConfig = fullConfig.reporter.filter((f) => f[0].toLowerCase().includes('slackreporter'))[0][1];

    if (slackReporterConfig) {
      this.meta = slackReporterConfig.meta || [];
      this.sendResults = slackReporterConfig.sendResults || 'always';
      this.customLayout = slackReporterConfig.layout;
      this.customLayoutAsync = slackReporterConfig.layoutAsync;
      this.slackChannels = slackReporterConfig.channels;
      this.maxNumberOfFailuresToShow = slackReporterConfig.maxNumberOfFailuresToShow || 10;
    }
    this.resultsParser = new ResultsParser();
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onTestEnd(test: TestCase, result: TestResult): void {
    this.resultsParser.addTestResult(test.parent.title, test);
  }

  async onEnd(): Promise<void> {
    const { okToProceed, message } = this.preChecks();
    if (!okToProceed) {
      this.log(message);
      return;
    }

    const resultSummary = await this.resultsParser.getParsedResults();
    resultSummary.meta = this.meta;
    const maxRetry = Math.max(...resultSummary.tests.map((o) => o.retry));
    if (
      this.sendResults === 'on-failure'
      && resultSummary.tests.filter((z) => (z.status === 'failed' || z.status === 'timedOut') && z.retry === maxRetry).length === 0
    ) {
      this.log('⏩ Slack reporter - no failures found');
      return;
    }

    const slackClient = new SlackClient(
      new WebClient(process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
        logLevel: LogLevel.DEBUG,
      }),
    );
    const result = await slackClient.sendMessage({
      options: {
        channelIds: this.slackChannels,
        summaryResults: resultSummary,
        customLayout: this.customLayout,
        customLayoutAsync: this.customLayoutAsync,
        maxNumberOfFailures: this.maxNumberOfFailuresToShow,
      },
    });
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  }

  preChecks(): { okToProceed: boolean; message?: string } {
    if (this.sendResults === 'off') {
      return { okToProceed: false, message: '❌ Slack reporter is disabled' };
    }

    if (!process.env.SLACK_BOT_USER_OAUTH_TOKEN) {
      return {
        okToProceed: false,
        message: '❌ SLACK_BOT_USER_OAUTH_TOKEN was not found',
      };
    }

    if (
      !this.sendResults
      || !['always', 'on-failure', 'off'].includes(this.sendResults)
    ) {
      return {
        okToProceed: false,
        message:
          "❌ \"sendResults\" is not valid. Expecting one of ['always', 'on-failure', 'off'].",
      };
    }

    if (!this.sendResults || this.slackChannels?.length === 0) {
      return {
        okToProceed: false,
        message: '❌ Slack channel(s) was not provided in the config',
      };
    }

    if (this.customLayout && typeof this.customLayout !== 'function') {
      return {
        okToProceed: false,
        message: '❌ Custom layout is not a function',
      };
    }

    if (
      this.customLayoutAsync
      && typeof this.customLayoutAsync !== 'function'
    ) {
      return {
        okToProceed: false,
        message: '❌ customLayoutAsync is not a function',
      };
    }

    if (this.meta && !Array.isArray(this.meta)) {
      return { okToProceed: false, message: '❌ Meta is not an array' };
    }
    return { okToProceed: true };
  }

  log(message: string | undefined): void {
    // eslint-disable-next-line no-console
    console.log(message);
    if (message) {
      this.logs.push(message);
    }
  }
}
export default SlackReporter;
