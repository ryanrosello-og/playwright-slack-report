/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
/* eslint-disable no-control-regex */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */

import {
  failure, flaky, pass, SummaryResults,
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

  private separateFlakyTests: boolean;

  constructor(
    options: { separateFlakyTests: boolean } = { separateFlakyTests: false },
  ) {
    this.result = [];
    this.separateFlakyTests = options.separateFlakyTests;
  }

  async getParsedResults(): Promise<SummaryResults> {
    const failures = await this.getFailures();
    const flakes = await this.getFlakes();
    let passes = await this.getPasses();

    if (this.separateFlakyTests) {
      passes = this.doSeparateFlakyTests(passes, flakes);
    }

    const summary: SummaryResults = {
      passed: passes.length,
      failed: failures.length,
      flaky: this.separateFlakyTests ? flakes.length : undefined,
      skipped: 0,
      failures,
      tests: [],
    };
    for (const suite of this.result) {
      summary.tests = summary.tests.concat(suite.testSuite.tests);
      for (const test of suite.testSuite.tests) {
        if (test.status === 'skipped') {
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

  async getFlakes(): Promise<Array<flaky>> {
    const flaky: Array<flaky> = [];
    for (const suite of this.result) {
      for (const test of suite.testSuite.tests) {
        if (test.status === 'passed' && test.retry > 0) {
          flaky.push({
            test: ResultsParser.getTestName(test),
            retry: test.retry,
          });
        }
      }
    }
    return flaky;
  }

  async getPasses(): Promise<Array<pass>> {
    const passes: Array<pass> = [];
    for (const suite of this.result) {
      for (const test of suite.testSuite.tests) {
        if (test.status === 'passed') {
          passes.push({
            test: ResultsParser.getTestName(test),
          });
        }
      }
    }
    return passes;
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

  /** removes tests from the passed array that only passed on a retry (flaky).
   * Does not modify param passed, returns a new passed array. */
  doSeparateFlakyTests(passes: Array<pass>, flakes: Array<flaky>) {
    const _passes: Map<string, pass> = new Map();

    for (const pass of passes) {
      _passes.set(pass.test, pass);
    }

    for (const flake of flakes) {
      _passes.delete(flake.test);
    }

    return [..._passes.values()];
  }
}
