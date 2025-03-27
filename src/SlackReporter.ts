/* eslint-disable class-methods-use-this */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
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
import { SummaryResults } from '.';

class SlackReporter implements Reporter {
  private customLayout: Function | undefined;

  private customLayoutAsync: Function | undefined;

  private customFailureLayout: Function | undefined;

  private customFailureLayoutAsync: Function | undefined;

  private customSuccessLayout: Function | undefined;

  private maxNumberOfFailuresToShow: number;

  private showInThread: boolean;

  private meta: Array<{ key: string; value: string }> = [];

  private resultsParser: ResultsParser;

  private sendResults: 'always' | 'on-failure' | 'off' = 'on-failure';

  private slackChannels: string[] = [];

  private onSuccessSlackChannels: string[] = [];

  private teamSlackChannels: {
    channelName: string;
    testNamePattern: string;
  }[] = [];

  private slackLogLevel: LogLevel | undefined;

  private slackOAuthToken: string | undefined;

  private slackWebHookUrl: string | undefined;

  private slackWebHookChannel: string | undefined;

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
      this.customFailureLayout = slackReporterConfig.onFailureLayout;
      this.customFailureLayoutAsync = slackReporterConfig.onFailureLayoutAsync;
      this.customSuccessLayout = slackReporterConfig.onSuccessLayout;
      this.slackChannels = slackReporterConfig.channels;
      this.onSuccessSlackChannels
        = slackReporterConfig.onSuccessChannels || this.slackChannels;
      this.teamSlackChannels = slackReporterConfig.teamChannels || [];
      this.maxNumberOfFailuresToShow
        = slackReporterConfig.maxNumberOfFailuresToShow !== undefined
          ? slackReporterConfig.maxNumberOfFailuresToShow
          : 10;
      this.slackOAuthToken = slackReporterConfig.slackOAuthToken || undefined;
      this.slackWebHookUrl = slackReporterConfig.slackWebHookUrl || undefined;
      this.slackWebHookChannel
        = slackReporterConfig.slackWebHookChannel || undefined;
      this.disableUnfurl = slackReporterConfig.disableUnfurl || false;
      this.showInThread = slackReporterConfig.showInThread || false;
      this.slackLogLevel = slackReporterConfig.slackLogLevel || LogLevel.DEBUG;
      this.proxy = slackReporterConfig.proxy || undefined;
    }
    this.resultsParser = new ResultsParser();
  }

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
    const testsFailed = resultSummary.failed > 0;

    if (this.sendResults === 'on-failure' && !testsFailed) {
      this.log('⏩ Slack reporter - no failures found');
      return;
    }

    if (
      resultSummary.passed === 0
      && resultSummary.failed === 0
      && resultSummary.flaky === 0
      && resultSummary.skipped === 0
      && resultSummary.failures.length === 0
      && resultSummary.tests.length === 0
    ) {
      this.log('⏩ Slack reporter - Playwright reported : "No tests found"');
      return;
    }

    const agent = this.proxy ? new HttpsProxyAgent(this.proxy) : undefined;

    // Use webhook if provided
    if (this.slackWebHookUrl) {
      const webhook = new IncomingWebhook(this.slackWebHookUrl, {
        channel: this.slackWebHookChannel,
        agent,
      });
      const slackWebhookClient = new SlackWebhookClient(webhook);
      const webhookResult = await slackWebhookClient.sendMessage({
        customLayout: this.customLayout,
        customLayoutAsync: this.customLayoutAsync,
        maxNumberOfFailures: this.maxNumberOfFailuresToShow,
        disableUnfurl: this.disableUnfurl,
        summaryResults: resultSummary,
      });

      console.log(JSON.stringify(webhookResult, null, 2));
    } else {
      // Use OAuth token if provided
      const slackClient = new SlackClient(
        new WebClient(
          this.slackOAuthToken || process.env.SLACK_BOT_USER_OAUTH_TOKEN,
          {
            logLevel: this.slackLogLevel || LogLevel.DEBUG,
            agent,
          },
        ),
      );

      // No failures, send complete results to onSuccessSlackChannels
      if (!testsFailed && this.onSuccessSlackChannels) {
        for (const channel of this.onSuccessSlackChannels) {
          await this.postResults(
            slackClient,
            channel,
            resultSummary,
            false,
            false,
          );
        }
      }

      // There are failures, send complete results to slackChannels
      if (testsFailed && this.slackChannels) {
        for (const channel of this.slackChannels) {
          await this.postResults(
            slackClient,
            channel,
            resultSummary,
            false,
            false,
          );
        }
      }

      // Send individual results to each team channel if any
      if (this.teamSlackChannels) {
        // Send failure results to each channel
        const failuresGroupedByTeam
          = await this.resultsParser.getParsedFailureResultsByPattern(
            this.teamSlackChannels,
          );
        for (const { channel, team, summary } of failuresGroupedByTeam) {
          // New copy of this.meta instead of reference, to avoid data accumulation
          summary.meta = [...this.meta];
          summary.meta.push({ key: 'Team', value: team });
          await this.postResults(slackClient, channel, summary, true, true);
        }

        // Send success results to each team that did not have any failures
        const successGroupedByTeam
          = await this.resultsParser.getParsedSuccessResultsByPatternWithoutFailures(
            this.teamSlackChannels,
          );
        for (const { channel, team, summary } of successGroupedByTeam) {
          // New copy of this.meta instead of reference, to avoid data accumulation
          summary.meta = [...this.meta];
          summary.meta.push({ key: 'Team', value: team });
          await this.postResults(slackClient, channel, summary, false, true);
        }
      }
    }
  }

  preChecks(): { okToProceed: boolean; message?: string } {
    const noSuccessChannelsProvided
      = this.sendResults === 'always'
      && (!this.onSuccessSlackChannels
        || this.onSuccessSlackChannels.length === 0);

    const noFailureChannelsProvided
      = ['always', 'on-failure'].includes(this.sendResults)
      && (!this.teamSlackChannels || this.teamSlackChannels.length === 0)
      && (!this.slackChannels || this.slackChannels.length === 0);

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

    if (this.slackWebHookUrl && this.showInThread) {
      return {
        okToProceed: false,
        message:
          '❌ The showInThread feature is only supported when using slackOAuthToken or process.env.SLACK_BOT_USER_OAUTH_TOKEN',
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

    if (noSuccessChannelsProvided) {
      return {
        okToProceed: false,
        message:
          '❌ Slack channel(s) for successful tests notifications was not provided in the config',
      };
    }

    if (noFailureChannelsProvided) {
      return {
        okToProceed: false,
        message:
          '❌ Slack channel(s) for failed tests notifications was not provided in the config',
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

    if (
      this.customFailureLayout
      && typeof this.customFailureLayout !== 'function'
    ) {
      return {
        okToProceed: false,
        message: '❌ On Failure Layout is not a function',
      };
    }

    if (
      this.customFailureLayoutAsync
      && typeof this.customFailureLayoutAsync !== 'function'
    ) {
      return {
        okToProceed: false,
        message: '❌ On Failure Layout Async is not a function',
      };
    }

    if (
      this.customSuccessLayout
      && typeof this.customSuccessLayout !== 'function'
    ) {
      return {
        okToProceed: false,
        message: '❌ On Success Layout is not a function',
      };
    }

    if (this.meta && !Array.isArray(this.meta)) {
      return { okToProceed: false, message: '❌ Meta is not an array' };
    }
    return { okToProceed: true };
  }

  log(message: string | undefined): void {
    console.log(message);
    if (message) {
      this.logs.push(message);
    }
  }

  printsToStdio(): boolean {
    return false;
  }

  async postResults(
    slackClient: SlackClient,
    channelName: string,
    summary: SummaryResults,
    isFailureReport?: boolean,
    isTeamReport?: boolean,
  ): Promise<void> {
    let reportLayout: Function | undefined;
    let reportLayoutAsync: Function | undefined;

    const channel = [];
    channel.push(channelName);

    if (isFailureReport && isTeamReport) {
      reportLayout = this.customFailureLayout;
      reportLayoutAsync = this.customFailureLayoutAsync;
    } else if (!isFailureReport && isTeamReport) {
      reportLayout = this.customSuccessLayout;
      reportLayoutAsync = this.customLayoutAsync;
    } else if (!isTeamReport) {
      reportLayout = this.customLayout;
      reportLayoutAsync = this.customLayoutAsync;
    }

    const resultList = await slackClient.sendMessage({
      options: {
        channelIds: channel,
        customLayout: reportLayout,
        customLayoutAsync: reportLayoutAsync,
        maxNumberOfFailures: this.maxNumberOfFailuresToShow,
        disableUnfurl: this.disableUnfurl,
        summaryResults: summary,
        showInThread: this.showInThread,
      },
    });

    console.log(JSON.stringify(resultList, null, 2));

    if (this.showInThread && summary.failures.length > 0) {
      for (const result of resultList) {
        await slackClient.attachDetailsToThread({
          channelIds: [result.channel],
          ts: result.ts,
          summaryResults: summary,
          maxNumberOfFailures: this.maxNumberOfFailuresToShow,
        });
      }
    }
  }
}

export default SlackReporter;
