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
  expectedStatus?: 'passed' | 'failed' | 'skipped';
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
    let data: string;
    let parsedData: JSONResult;
    try {
      data = fs.readFileSync(filePath, 'utf-8');
      parsedData = JSON.parse(data);
    } catch (error) {
      throw new Error(
        `Error reading or parsing JSON file [${filePath}]: \n\t${error}`,
      );
    }

    const retries = parsedData.config.projects[0]?.retries || 0;
    for (const suite of parsedData.suites) {
      // eslint-disable-next-line no-await-in-loop
      await this.parseTestSuite(suite, retries);
    }

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

    return summary;
  }

  async parseTestSuite(suites: any, retries: number) {
    let testResults = [];

    // if it has direct specs
    if (suites.specs?.length > 0) {
      testResults = await this.parseTests(suites.title, suites.specs, retries);
      this.updateResults({
        testSuite: {
          title: suites.title ?? suites.file,
          tests: testResults,
        },
      });
    }

    if (suites.suites?.length > 0) {
      for (const suite of suites.suites) {
        // eslint-disable-next-line no-await-in-loop
        await this.parseTestSuite(suite, retries);
      }
    }
  }

  async parseTests(suiteName: any, specs: any, retries: number) {
    const testResults: testResult[] = [];

    for (const spec of specs) {
      for (const test of spec.tests) {
        const { expectedStatus } = test;
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
            expectedStatus,
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

  getExpectedFailure(test: any) {
    const failureReason = test.annotations?.find((f) => f.type === 'fail');

    if (failureReason) {
      return failureReason.description;
    }

    return '';
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
        if (
          test.status === 'failed'
          || test.status === 'timedOut'
          || test.expectedStatus === 'failed'
        ) {
          // only flag as failed if the last attempt has failed
          if (test.retries === test.retry) {
            failures.push({
              suite: test.suiteName,
              test: ResultsParser.getTestName(test),
              failureReason: test.reason,
            });
          }
        }
      }
    }
    return failures;
  }

  async getParsedFailureResultsByPattern(
    channelAndTestPatternArray: Array<{
      channelName: string;
      testNamePattern: string;
    }>,
  ): Promise<Map<string, SummaryResults>> {
    const failures = await this.getFailures();

    // Initialize the map object that will contain the filtered results
    const results = new Map<string, SummaryResults>();

    // Filter and group failures by pattern
    for (const { channelName, testNamePattern } of channelAndTestPatternArray) {
      const testNamePatternRegexp = new RegExp(
        `${testNamePattern}(?:\\s|\\[)`,
        'i',
      );

      // Filter out failures that belong to the current pattern
      const testNamePatternFailures = failures.filter(
        (failure) => testNamePatternRegexp.test(failure.test),
      );

      if (testNamePatternFailures.length > 0) {
        // Initialize summary result for the current pattern
        const summary: SummaryResults = {
          passed: 0,
          failed: testNamePatternFailures.length,
          flaky: 0,
          skipped: 0,
          failures: testNamePatternFailures,
          tests: testNamePatternFailures.map((failure) => ({
            suiteName: failure.suite,
            name: failure.test,
            browser: undefined,
            projectName: undefined,
            endedAt: undefined,
            reason: failure.failureReason,
            retry: undefined,
            startedAt: undefined,
            status: 'failed',
            attachments: undefined,
          })),
        };

        results.set(channelName, summary);
      }
    }

    return results;
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
      const resIndex = this.result.findIndex(
        (res) => res.testSuite.title === data.testSuite.title,
      );
      if (resIndex > -1) {
        for (const test of data.testSuite.tests) {
          const testIndex = this.result[resIndex].testSuite.tests.findIndex(
            (tes) => `${tes.projectName}${tes.name}`
              === `${test.projectName}${test.name}`,
          );
          if (testIndex > -1) {
            this.result[resIndex].testSuite.tests[testIndex] = test;
          } else {
            this.result[resIndex].testSuite.tests.push(test);
          }
        }
      } else {
        this.result.push(data);
      }
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
        reason:
          testCase.expectedStatus === 'failed'
            ? this.getExpectedFailure(testCase)
            : this.safelyDetermineFailure(result),
        attachments: result.attachments,
        expectedStatus: testCase.expectedStatus,
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

  cleanseReason(rawReason: string): string {
    // eslint-disable-next-line prefer-regex-literals
    const ansiRegex = new RegExp(
      '([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))',
      'g',
    );

    const ansiCleansed = rawReason ? rawReason.replace(ansiRegex, '') : '';
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
