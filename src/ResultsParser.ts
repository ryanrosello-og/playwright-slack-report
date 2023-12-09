/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
/* eslint-disable no-control-regex */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import * as fs from 'fs';
import { TestCase } from '@playwright/test/reporter';
import {
  failure, JSONResult, Spec, SummaryResults,
} from '.';

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

  async parseFromJsonFile(filePath: string) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsedData: JSONResult = JSON.parse(data);

    const { retries } = parsedData.config.projects[0];
    await this.parseTestSuite(parsedData.suites, retries);

    const failures = await this.getFailures();
    const summary: SummaryResults = {
      passed: parsedData.stats.expected,
      failed: parsedData.stats.unexpected,
      flaky: parsedData.stats.flaky,
      skipped: parsedData.stats.skipped,
      failures,
      tests: [],
    };

    for (const suite of this.result) {
      summary.tests = summary.tests.concat(suite.testSuite.tests);
    }
    // console.log('🚀~ summary:', JSON.stringify(summary, null, 2));

    return summary;
  }

  async parseTestSuite(suites: any, retries: number, suiteIndex = 0) {
    let testResults = [];
    if (suites[0].suites?.length > 0) {
      testResults = await this.parseTests(
        suites[0].title,
        suites[0].specs,
        retries,
      );
      this.updateResults({
        testSuite: {
          title: suites[0].title,
          tests: testResults,
        },
      });
      await this.parseTestSuite(
        suites[suiteIndex].suites,
        retries,
        (suiteIndex += 1),
      );
    } else {
      testResults = await this.parseTests(
        suites[0].title,
        suites[0].specs,
        retries,
      );
      this.updateResults({
        testSuite: {
          title: suites[0].title,
          tests: testResults,
        },
      });
      // eslint-disable-next-line no-useless-return
      return;
    }
  }

  async parseTests(suiteName: any, specs: any, retries: number) {
    const testResults: testResult[] = [];

    for (const spec of specs) {
      for (const test of spec.tests) {
        for (const result of test.results) {
          testResults.push({
            suiteName,
            name: spec.title,
            status: result.status === 'unexpected' ? 'failed' : result.status,
            browser: test.projectName,
            projectName: test.projectName,
            retry: result.retry,
            retries,
            startedAt: result.startTime,
            endedAt: new Date(
              new Date(result.startTime).getTime() + result.duration,
            ).toISOString(),
            reason: result.error
              ? this.getFailure(result.error.snippet, result.error.stack)
              : '',
            attachments: result.attachments,
          });
        }
      }
    }
    return testResults;
  }

  getFailure(snippet: string, stack: string) {
    const fullError = `${snippet}\r\n${stack || ''}`;
    return this.cleanseReason(fullError);
  }

  async getParsedResults(allTests: Array<TestCase>): Promise<SummaryResults> {
    const failures = await this.getFailures();
    // use Playwright recommended way of extracting test stats:
    // https://github.com/microsoft/playwright/issues/27498#issuecomment-1766766335
    const stats = {
      expected: 0,
      skipped: 0,
      unexpected: 0,
      flaky: 0,
    };
    // eslint-disable-next-line no-plusplus
    for (const test of allTests) ++stats[test.outcome()];
    const summary: SummaryResults = {
      passed: stats.expected,
      failed: stats.unexpected,
      flaky: stats.flaky,
      skipped: stats.skipped,
      failures,
      tests: [],
    };
    for (const suite of this.result) {
      summary.tests = summary.tests.concat(suite.testSuite.tests);
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

  addTestResultFromJson({
    suiteName,
    spec,
    testCase,
    projectBrowserMapping,
    retries,
  }: {
    suiteName: any;
    spec: Spec;
    testCase: any;
    projectBrowserMapping: any;
    retries: number;
  }) {
    const testResults: testResult[] = [];
    const projectSettings = this.determineBrowser(
      projectBrowserMapping[0].projectName,
      projectBrowserMapping,
    );
    for (const result of testCase.results) {
      testResults.push({
        suiteName,
        name: spec.title,
        status: result.status,
        browser: projectSettings.browser,
        projectName: projectSettings.projectName,
        retry: result.retry,
        retries,
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

  addTestResult(suiteName: any, testCase: any, projectBrowserMapping: any) {
    const testResults: testResult[] = [];
    const projectSettings = this.determineBrowser(
      testCase._projectId,
      projectBrowserMapping,
    );
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

  determineBrowser(
    projectName: string,
    browserMappings: { projectName: string; browser: string }[],
  ): {
    projectName: string;
    browser: string;
  } {
    const browserMapping = browserMappings.find(
      (mapping) => mapping.projectName === projectName,
    );
    if (browserMapping) {
      return {
        projectName: browserMapping.projectName,
        browser: browserMapping.browser,
      };
    }
    return {
      projectName: '',
      browser: '',
    };
  }
}
