/* eslint-disable no-control-regex */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
export type testResult = {
  suiteName: string;
  name: string;
  testId?: number;
  testRunId?: number;
  attachment?: string;
  browser?: string;
  endedAt: string;
  reason: string;
  retry: number;
  startedAt: string;
  status: 'failed' | 'passed' | 'skipped' | 'aborted';
  // eslint-disable-next-line no-use-before-define
  steps?: Array<testStep>;
};

export type testStep = {
  level: 'INFO' | 'ERROR';
  timestamp: string;
  message: string;
  testId?: number;
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
    // eslint-disable-next-line no-console
    console.log(this.resultsData);
  }

  async getParsedResults(): Promise<testSuite[]> {
    return this.result;
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
        });
      }
    }
    return testResults;
  }

  cleanseReason(rawReason: string) {
    return rawReason
      ? rawReason
        .replace(/\u001b\[2m/g, '')
        .replace(/\u001b\[22m/g, '')
        .replace(/\u001b\[31m/g, '')
        .replace(/\u001b\[39m/g, '')
        .replace(/\u001b\[32m/g, '')
        .replace(/\u001b\[27m/g, '')
        .replace(/\u001b\[7m/g, '')
      : '';
  }
}
