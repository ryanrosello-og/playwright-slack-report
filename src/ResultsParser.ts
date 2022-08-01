/* eslint-disable import/extensions */
/* eslint-disable no-control-regex */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

// eslint-disable-next-line import/no-unresolved
import { failure, testSummary } from './SlackClient';

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
  private resultsData: any;

  private result: testSuite[];

  constructor(results: any) {
    this.result = [];
    this.resultsData = results;
  }

  async getParsedResults(): Promise<testSummary> {
    const summary: testSummary = {
      passed: 0,
      failed: 0,
      skipped: 0,
      aborted: 0,
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
        } else if (test.status === 'aborted') {
          summary.aborted += 1;
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

  async parse() {
    for (const project of this.resultsData.suites) {
      for (const suite of project.suites) {
        // eslint-disable-next-line no-await-in-loop
        await this.parseTestSuite(suite);
      }
    }
  }

  async parseTestSuite(
    suite: {
      suites: string | any[];
      title: any;
      tests: any;
      parent: { title: any };
    },
    suiteIndex = 0,
  ) {
    let testResults = [];
    if (suite.suites?.length > 0) {
      testResults = await this.parseTests(suite.title, suite.tests);
      this.updateResults({
        testSuite: {
          title: suite.parent.title
            ? `${suite.parent.title} > ${suite.title}`
            : suite.title,
          tests: testResults,
        },
      });
      await this.parseTestSuite(suite.suites[suiteIndex], (suiteIndex += 1));
    } else {
      testResults = await this.parseTests(suite.title, suite.tests);
      this.updateResults({
        testSuite: {
          title: suite.parent.title
            ? `${suite.parent.title} > ${suite.title}`
            : suite.title,
          tests: testResults,
        },
      });
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  updateResults(data: { testSuite: any }) {
    if (data.testSuite.tests.length > 0) {
      this.result.push(data);
    }
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
