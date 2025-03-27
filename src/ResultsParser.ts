/* eslint-disable class-methods-use-this */
/* eslint-disable import/extensions */
/* eslint-disable max-len */
/* eslint-disable no-control-regex */
/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-regex-literals */

import * as fs from 'fs';
import { TestCase } from '@playwright/test/reporter';
import {
  failure,
  JSONResult,
  Spec,
  success,
  SummaryResults,
  testStatuses,
  TestStatusType,
} from '.';

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
  status: TestStatusType;
  expectedStatus?: Omit<TestStatusType, 'timedOut'>;
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
  private readonly result: testSuite[];

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
          test.status === testStatuses.FAILED
          || test.status === testStatuses.TIMED_OUT
          || test.expectedStatus === testStatuses.FAILED
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

  /**
   * Retrieves a list of passed tests from the test results.
   *
   * @returns A promise that resolves to an array of objects representing the passed tests.
   * Each object contains the suite name and the test name.
   */
  async getPasses(): Promise<Array<success>> {
    const passes: success[] = [];

    for (const suite of this.result) {
      for (const test of suite.testSuite.tests) {
        if (test.status === testStatuses.PASSED) {
          passes.push({
            suite: test.suiteName,
            test: ResultsParser.getTestName(test),
          });
        }
      }
    }

    return passes;
  }

  /**
   * Parses and filters failure results based on testNamePattern
   * and groups them by channel name.
   *
   * @param channelAndTestPatternArray - An array of objects containing channel names
   * and test (team) name patterns.
   * @returns A promise that resolves to a Map where the key is the channel name
   * and the value is the summary of results.
   *
   * @example
   * const patterns = [
   *   { channelName: 'channel1', testNamePattern: '@testPattern1' },
   *   { channelName: 'channel2', testNamePattern: '@testPattern2' }
   * ];
   * const results = await getParsedFailureResultsByPattern(patterns);
   */
  async getParsedFailureResultsByPattern(
    channelAndTestPatternArray: Array<{
      channelName: string;
      testNamePattern: string;
    }>,
  ): Promise<
    Array<{ channel: string; team: string; summary: SummaryResults }>
  > {
    const filteredResults: {
      channel: string;
      team: string;
      summary: SummaryResults;
    }[] = [];

    const failures = await this.getFailures();
    const parsedPatterns = this.parseTestPatterns(channelAndTestPatternArray);

    // Filter and group failures by pattern
    for (const { channelName, testNamePattern } of parsedPatterns) {
      const testNamePatternRegexp = new RegExp(
        `${testNamePattern}(?:\\s|\\[|$)`,
        'i',
      );

      // Filter out failures that belong to the current pattern
      const testNamePatternFailures = failures.filter((failure) => testNamePatternRegexp.test(failure.test));

      if (testNamePatternFailures.length > 0) {
        // Initialize summary result for the current pattern
        const summaryResults: SummaryResults = {
          passed: 0,
          failed: testNamePatternFailures.length,
          flaky: 0,
          skipped: 0,
          failures: testNamePatternFailures,
          tests: testNamePatternFailures.map((resFailure) => ({
            suiteName: resFailure.suite,
            name: resFailure.test,
            browser: undefined,
            projectName: undefined,
            endedAt: undefined,
            reason: resFailure.failureReason,
            retry: undefined,
            startedAt: undefined,
            status: testStatuses.FAILED,
          })),
        };

        filteredResults.push({
          channel: channelName,
          team: testNamePattern,
          summary: summaryResults,
        });
      }
    }

    return filteredResults;
  }

  /**
   * Parses and groups successful test results based on testNamePattern
   * and groups them by channel name.
   *
   * @param channelAndTestPatternArray - An array of objects containing channel names
   *        and test name patterns.
   * @returns A promise that resolves to a Map where the key is the channel name
   *          and the value is the summary of results.
   *
   * @example
   * const patterns = [
   *   { channelName: 'channel1', testNamePattern: '@testPattern1' },
   *   { channelName: 'channel2', testNamePattern: '@testPattern2' }
   * ];
   * const results = await getParsedSuccessResultsByPattern(patterns);
   */
  async filterParsedSuccessResultsByPattern(
    channelAndTestPatternArray: Array<{
      channelName: string;
      testNamePattern: string;
    }>,
  ): Promise<
    Array<{ channel: string; team: string; summary: SummaryResults }>
  > {
    const filteredResults: {
      channel: string;
      team: string;
      summary: SummaryResults;
    }[] = [];

    const passedTests = await this.getPasses();

    // Filter and group passed by pattern
    for (const { channelName, testNamePattern } of channelAndTestPatternArray) {
      const testNamePatternRegexp = new RegExp(
        `${testNamePattern}(?:\\s|\\[|$)`,
        'i',
      );

      // Filter out passes that belong to the current pattern
      const passedTestsFilteredByPattern = passedTests.filter((passed) => testNamePatternRegexp.test(passed.test));

      if (passedTestsFilteredByPattern.length > 0) {
        // Initialize summary result for the current pattern
        const summaryResults = {
          passed: passedTestsFilteredByPattern.length,
          failed: 0,
          flaky: 0,
          skipped: 0,
          failures: [],
          tests: passedTestsFilteredByPattern.map((pass) => ({
            suiteName: pass.suite,
            name: pass.test,
            browser: undefined,
            projectName: undefined,
            endedAt: undefined,
            reason: undefined,
            retry: 0,
            startedAt: undefined,
            status: testStatuses.PASSED,
          })),
        };

        filteredResults.push({
          channel: channelName,
          team: testNamePattern,
          summary: summaryResults,
        });
      }
    }

    return filteredResults;
  }

  /**
   * Retrieves parsed success results by pattern,
   * excluding any pattern (team) that have failures.
   *
   * @param channelAndTestPatternArray - An array of objects containing channel names
   *        and test name patterns.
   * @returns A promise that resolves to a Map where the keys are channel names
   *          and the values are summary results, excluding channels that have any failed tests.
   */
  async getParsedSuccessResultsByPatternWithoutFailures(
    channelAndTestPatternArray: Array<{
      channelName: string;
      testNamePattern: string;
    }>,
  ): Promise<
    Array<{ channel: string; team: string; summary: SummaryResults }>
  > {
    // Get failed and passed test results
    const [failedTests, passedTests] = await Promise.all([
      this.getParsedFailureResultsByPattern(channelAndTestPatternArray),
      this.filterParsedSuccessResultsByPattern(channelAndTestPatternArray),
    ]);

    // Extract failed channel names
    const failedTeams = new Set(failedTests.map((failed) => failed.team));

    // Remove results that have failed tests
    return passedTests.filter((passed) => !failedTeams.has(passed.team));
  }

  static getTestName(test: Partial<testResult>): string {
    const testName = test.name;
    if (test.browser && test.projectName) {
      if (test.browser === test.projectName) {
        return `${testName} [${test.browser}]`;
      }
      return `${testName} [Project Name: ${test.projectName}] using ${test.browser}`;
    }

    return testName;
  }

  /**
   * Splits test name patterns in the provided array of objects and returns a new array
   * where each test name pattern is separated and associated with its respective channel name.
   *
   * @param channelAndTestPatternArray - An array of objects, each containing a `channelName`
   * and a `testNamePattern`. The `testNamePattern` can contain multiple patterns separated by " | ".
   * @returns A new array of objects where each object contains a `channelName` and a single
   * `testNamePattern` derived from splitting the original patterns.
   *
   * @example
   * const input = [
   *   { channelName: 'channel1', testNamePattern: 'test1 | test2' },
   *   { channelName: 'channel2', testNamePattern: 'test3' }
   * ];
   * const result = checkTestPatterns(input);
   * // result:
   * // [
   * //   { channelName: 'channel1', testNamePattern: 'test1' },
   * //   { channelName: 'channel1', testNamePattern: 'test2' },
   * //   { channelName: 'channel2', testNamePattern: 'test3' }
   * // ]
   */
  parseTestPatterns(
    channelAndTestPatternArray: Array<{
      channelName: string;
      testNamePattern: string;
    }>,
  ): Array<{ channelName: string; testNamePattern: string }> {
    return channelAndTestPatternArray.flatMap(
      ({ channelName, testNamePattern }) => testNamePattern.split(' | ').map((tag) => ({
        channelName,
        testNamePattern: tag.trim(),
      })),
    );
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
    return `${this.cleanseReason(result.error?.message)} \n ${this.cleanseReason(result.error?.stack)}`;
  }

  cleanseReason(rawReason: string): string {
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
