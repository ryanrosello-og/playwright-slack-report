/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
/* eslint-disable no-control-regex */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import { failure, SummaryResults } from '.';

/* eslint-disable no-restricted-syntax */
export type testResult = {
  suiteName: string;
  name: string;
  browser?: string;
  projectName: string;
  endedAt: string;
  reason: string;
  retry: number;
  retries: number;
  startedAt: string;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped';
  attachments?: {
    body: string | undefined | Buffer;
    contentType: string;
    name: string;
    path: string;
  }[];
};

export type testSuite = {
  testSuite: {
    title: string;
    tests: testResult[];
    testRunId?: number;
  };
};

export default class ResultsParser {
  private result: testSuite[];

  constructor() {
    this.result = [];
  }

  async getParsedResults(): Promise<SummaryResults> {
    const failures = await this.getFailures();
    const summary: SummaryResults = {
      passed: 0,
      failed: failures.length,
      skipped: 0,
      failures,
      tests: [],
    };
    for (const suite of this.result) {
      summary.tests = summary.tests.concat(suite.testSuite.tests);
      for (const test of suite.testSuite.tests) {
        if (test.status === 'passed') {
          summary.passed += 1;
        } else if (test.status === 'skipped') {
          summary.skipped += 1;
        }
      }
    }
    return summary;
  }

  async getFailures(): Promise<Array<failure>> {
    const failures: Array<failure> = [];
    for (const suite of this.result) {
      for (const test of suite.testSuite.tests) {
        if (test.status === 'failed' || test.status === 'timedOut') {
          // only flag as failed if the last attempt has failed
          if (test.retries === test.retry) {
            failures.push({
              test: ResultsParser.getTestName(test),
              failureReason: test.reason,
            });
          }
        }
      }
    }
    return failures;
  }

  static getTestName(failedTest: any) {
    const testName = failedTest.name;
    if (failedTest.browser && failedTest.projectName) {
      if (failedTest.browser === failedTest.projectName) {
        return `${testName} [${failedTest.browser}]`;
      }
      return `${testName} [Project Name: ${failedTest.projectName}] using ${failedTest.browser}`;
    }

    return testName;
  }

  updateResults(data: { testSuite: any }) {
    if (data.testSuite.tests.length > 0) {
      this.result.push(data);
    }
  }

  addTestResult(suiteName: any, testCase: any) {
    const testResults: testResult[] = [];
    const projectSettings = this.getParentConfigInformation(testCase);
    for (const result of testCase.results) {
      testResults.push({
        suiteName,
        name: testCase.title,
        status: result.status,
        browser: projectSettings.browser,
        projectName: projectSettings.projectName,
        retry: result.retry,
        retries: testCase.retries,
        startedAt: new Date(result.startTime).toISOString(),
        endedAt: new Date(
          new Date(result.startTime).getTime() + result.duration,
        ).toISOString(),
        reason: this.safelyDetermineFailure(result),
        attachments: result.attachments,
      });
    }
    this.updateResults({
      testSuite: {
        title: suiteName,
        tests: testResults,
      },
    });
  }

  safelyDetermineFailure(result: {
    errors: any[];
    error: { message: string; stack: string };
  }): string {
    if (result.errors.length > 0) {
      const fullError = result.errors
        .map((e) => `${e.message}\r\n${e.stack ? e.stack : ''}\r\n`)
        .join();
      return this.cleanseReason(fullError);
    }
    return `${this.cleanseReason(
      result.error?.message,
    )} \n ${this.cleanseReason(result.error?.stack)}`;
  }

  cleanseReason(rawReaseon: string): string {
    // eslint-disable-next-line prefer-regex-literals
    const ansiRegex = new RegExp(
      '([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))',
      'g',
    );

    const ansiCleansed = rawReaseon ? rawReaseon.replace(ansiRegex, '') : '';
    const logsStripped = ansiCleansed
      .replace(
        /============================================================\n/g,
        '',
      )
      .replace(
        /============================================================\r\n/g,
        '',
      )
      .replace(
        /=========================== logs ===========================\n/g,
        '',
      );
    return logsStripped;
  }

  getParentConfigInformation(testCase: any): {projectName: string, browser: string} {
    if (testCase._projectConfig !== undefined) {
      return {
        projectName: testCase._projectConfig.name || '',
        browser: testCase._projectConfig.use?.defaultBrowserType || '',
      };
    } if (testCase.parent) {
      return this.getParentConfigInformation(testCase.parent);
    }
    return { projectName: '', browser: '' };
  }
}
