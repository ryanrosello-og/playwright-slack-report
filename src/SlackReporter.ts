/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { LogLevel, WebClient } from '@slack/web-api';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { IncomingWebhook } from '@slack/webhook';
import ResultsParser from './ResultsParser';
import SlackClient from './SlackClient';
import SlackWebhookClient from './SlackWebhookClient';

class SlackReporter implements Reporter {
  private customLayout: Function | undefined;

  private customLayoutAsync: Function | undefined;

  private maxNumberOfFailuresToShow: number;

  private showInThread: boolean;

  private meta: Array<{ key: string; value: string }> = [];

  private resultsParser: ResultsParser;

  private sendResults: 'always' | 'on-failure' | 'off' = 'on-failure';

  private slackChannels: string[] = [];

  private slackLogLevel: LogLevel | undefined;

  private slackOAuthToken: string | undefined;

  private slackWebHookUrl: string | undefined;

  private disableUnfurl: boolean | undefined;

  private proxy: string | undefined;

  private browsers: { projectName: string; browser: string }[] = [];

  private suite!: Suite;

  logs: string[] = [];

  onBegin(fullConfig: FullConfig, suite: Suite): void {
    this.suite = suite;
    this.logs = [];
    const slackReporterConfig = fullConfig.reporter.filter((f) => f[0].toLowerCase().includes('slackreporter'))[0][1];
    if (fullConfig.projects.length === 0) {
      this.browsers = [];
    } else {
      // eslint-disable-next-line max-len
      this.browsers = fullConfig.projects.map((obj) => ({
        projectName: obj.name,
        browser: obj.use.browserName
          ? obj.use.browserName
          : obj.use.defaultBrowserType,
      }));
    }

    if (slackReporterConfig) {
      this.meta = slackReporterConfig.meta || [];
      this.sendResults = slackReporterConfig.sendResults || 'always';
      this.customLayout = slackReporterConfig.layout;
      this.customLayoutAsync = slackReporterConfig.layoutAsync;
      this.slackChannels = slackReporterConfig.channels;
      this.maxNumberOfFailuresToShow
        = slackReporterConfig.maxNumberOfFailuresToShow || 10;
      this.slackOAuthToken = slackReporterConfig.slackOAuthToken || undefined;
      this.slackWebHookUrl = slackReporterConfig.slackWebHookUrl || undefined;
      this.disableUnfurl = slackReporterConfig.disableUnfurl || false;
      this.showInThread = slackReporterConfig.showInThread || false;
      this.slackLogLevel = slackReporterConfig.slackLogLevel || LogLevel.DEBUG;
      this.proxy = slackReporterConfig.proxy || undefined;
    }
    this.resultsParser = new ResultsParser();
  }

  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  onTestEnd(test: TestCase, result: TestResult): void {
    this.resultsParser.addTestResult(test.parent.title, test, this.browsers);
  }

  async onEnd(): Promise<void> {
    const { okToProceed, message } = this.preChecks();
    if (!okToProceed) {
      this.log(message);
      return;
    }

    const resultSummary = await this.resultsParser.getParsedResults(
      this.suite.allTests(),
    );
    resultSummary.meta = this.meta;
    const maxRetry = Math.max(...resultSummary.tests.map((o) => o.retry));
    if (
      this.sendResults === 'on-failure'
      && resultSummary.tests.filter(
        (z) => (z.status === 'failed' || z.status === 'timedOut')
          && z.retry === maxRetry,
      ).length === 0
    ) {
      this.log('⏩ Slack reporter - no failures found');
      return;
    }

    const agent = this.proxy ? new HttpsProxyAgent(this.proxy) : undefined;

    if (this.slackWebHookUrl) {
      const webhook = new IncomingWebhook(this.slackWebHookUrl, { agent });
      const slackWebhookClient = new SlackWebhookClient(webhook);
      const webhookResult = await slackWebhookClient.sendMessage({
        customLayout: this.customLayout,
        customLayoutAsync: this.customLayoutAsync,
        maxNumberOfFailures: this.maxNumberOfFailuresToShow,
        disableUnfurl: this.disableUnfurl,
        summaryResults: resultSummary,
      });
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(webhookResult, null, 2));
    } else {
      const slackClient = new SlackClient(
        new WebClient(
          this.slackOAuthToken || process.env.SLACK_BOT_USER_OAUTH_TOKEN,
          {
            logLevel: this.slackLogLevel || LogLevel.DEBUG,
            agent,
          },
        ),
      );

      const result = await slackClient.sendMessage({
        options: {
          channelIds: this.slackChannels,
          customLayout: this.customLayout,
          customLayoutAsync: this.customLayoutAsync,
          maxNumberOfFailures: this.maxNumberOfFailuresToShow,
          disableUnfurl: this.disableUnfurl,
          summaryResults: resultSummary,
          showInThread: this.showInThread,
        },
      });
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result, null, 2));
      if (this.showInThread && resultSummary.failures.length > 0) {
        for (let i = 0; i < result.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await slackClient.attachDetailsToThread({
            channelIds: [result[i].channel],
            ts: result[i].ts,
            summaryResults: resultSummary,
            maxNumberOfFailures: this.maxNumberOfFailuresToShow,
          });
        }
      }
    }
  }

  preChecks(): { okToProceed: boolean; message?: string } {
    if (this.sendResults === 'off') {
      return { okToProceed: false, message: '❌ Slack reporter is disabled' };
    }

    if (
      !this.slackWebHookUrl
      && !this.slackOAuthToken
      && !process.env.SLACK_BOT_USER_OAUTH_TOKEN
    ) {
      return {
        okToProceed: false,
        message:
          '❌ Neither slack webhook url, slackOAuthToken nor process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
      };
    }

    if (
      this.slackWebHookUrl
      && (process.env.SLACK_BOT_USER_OAUTH_TOKEN || this.slackOAuthToken)
    ) {
      return {
        okToProceed: false,
        message:
          '❌ You can only enable a single option, either provide a slack webhook url, slackOAuthToken or process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
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

  // eslint-disable-next-line class-methods-use-this
  printsToStdio(): boolean {
    return false;
  }
}
export default SlackReporter;
