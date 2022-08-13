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
  endedAt: string;
  reason: string;
  retry: number;
  startedAt: string;
  status: 'failed' | 'passed' | 'skipped' | 'aborted';
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
    const summary: SummaryResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: await this.getFailures(),
      tests: [],
    };
    for (const suite of this.result) {
      summary.tests = summary.tests.concat(suite.testSuite.tests);
      for (const test of suite.testSuite.tests) {
        if (test.status === 'passed') {
          summary.passed += 1;
        } else if (test.status === 'failed') {
          summary.failed += 1;
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
        if (test.status === 'failed') {
          failures.push({
            test: test.name,
            failureReason: test.reason,
          });
        }
      }
    }
    return failures;
  }

  updateResults(data: { testSuite: any }) {
    if (data.testSuite.tests.length > 0) {
      this.result.push(data);
    }
  }

  addTestResult(suiteName: any, test: any) {
    const testResults: testResult[] = [];
    for (const result of test.results) {
      testResults.push({
        suiteName,
        name: test.title,
        status: result.status,
        retry: result.retry,
        startedAt: new Date(result.startTime).toISOString(),
        endedAt: new Date(
          new Date(result.startTime).getTime() + result.duration,
        ).toISOString(),
        reason: `${this.cleanseReason(
          result.error?.message,
        )} \n ${this.cleanseReason(result.error?.stack)}`,
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

  async parseTests(suiteName: any, tests: any) {
    const testResults: testResult[] = [];

    for (const test of tests) {
      for (const result of test.results) {
        testResults.push({
          suiteName,
          name: test.title,
          status: result.status,
          retry: result.retry,
          startedAt: new Date(result.startTime).toISOString(),
          endedAt: new Date(
            new Date(result.startTime).getTime() + result.duration,
          ).toISOString(),
          reason: `${this.cleanseReason(
            result.error?.message,
          )} \n ${this.cleanseReason(result.error?.stack)}`,
          attachments: result.attachments,
        });
      }
    }
    return testResults;
  }

  cleanseReason(rawReaseon: string): string {
    // eslint-disable-next-line prefer-regex-literals
    const ansiRegex = new RegExp(
      '([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))',
      'g',
    );
    return rawReaseon ? rawReaseon.replace(ansiRegex, '') : '';
  }
}
