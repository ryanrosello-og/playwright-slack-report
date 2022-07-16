export type testResult = {
  suiteName: string;
  name: string;
  testId?: number;
  testRunId?: number;
  attachment?: string;
  browser: string;
  endedAt: string;
  reason: string;
  retry: number;
  startedAt: string;
  status: 'FAILED' | 'PASSED' | 'SKIPPED' | 'ABORTED';
  tags: {
    key: string;
    value: string;
  }[];
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
    console.log(this.resultsData);
  }

  async getParsedResults(): Promise<testSuite[]> {
    return this.result;
  }

  async parse() {
    for (const project of this.resultsData.suites) {
      for (const testSuite of project.suites) {
        await this.parseTestSuite(testSuite);
      }
    }
  }

  async parseTestSuite(suite: { suites: string | any[]; title: any; tests: any; parent: { title: any; }; }, suiteIndex = 0) {
    let testResults = [];
    if (suite.suites?.length > 0) {
      testResults = await this.parseTests(suite.title, suite.tests);
      this.updateResults({
        testSuite: {
          title: suite.parent.title ? `${suite.parent.title} > ${suite.title}` : suite.title,
          tests: testResults,
        },
      });
      await this.parseTestSuite(suite.suites[suiteIndex], suiteIndex++);
    } else {
      testResults = await this.parseTests(suite.title, suite.tests);
      this.updateResults({
        testSuite: {
          title: suite.parent.title ? `${suite.parent.title} > ${suite.title}` : suite.title,
          tests: testResults,
        },
      });
      return;
    }
  }

  updateResults(data: { testSuite: any; }) {
    if (data.testSuite.tests.length > 0) {
      this.result.push(data);
    }
  }

  async parseTests(suiteName: any, tests: any) {
    const testResults: testResult[] = [];

    for (const test of tests) {
      const browser = test._testType?.fixtures[0]?.fixtures?.defaultBrowserType[0];
      for (const result of test.results) {
        testResults.push({
          suiteName,
          name: test.title,
          tags: this.getTestTags(test.title),
          status: this.determineStatus(result.status),
          retry: result.retry,
          startedAt: new Date(result.startTime).toISOString(),
          endedAt: new Date(new Date(result.startTime).getTime() + result.duration).toISOString(),
          // testCase: `${result.location.file?}${result.location.line?}:${result.location.column?}`,
          reason: `${this.cleanseReason(result.error?.message)} \n ${this.cleanseReason(
            result.error?.stack,
          )}`,
          attachment: this.processAttachment(result.attachments),
          browser,
          steps: this.getTestSteps(result.steps),
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

  getTestTags(testTitle: string) {
    const tags = testTitle.match(/@\w*/g);

    if (tags) {
      return tags.map((c) => ({ key: 'tag', value: c.replace('@', '') }));
    }
    return null;
  }

  processAttachment(attachment) {
    if (attachment) {
      const screenshot = attachment.filter((a) => a.contentType === 'image/png');
      if (screenshot.length > 0) {
        // TODO: there could be more than one screenshot?
        return screenshot[0].path;
      }
    }
    return null;
  }

  determineStatus(status: string) {
    if (status === 'failed') return 'FAILED';
    else if (status === 'passed') return 'PASSED';
    else if (status === 'skipped') return 'SKIPPED';
    else return 'ABORTED';
  }

  getTestSteps(steps: any): testStep[] {
    const testSteps = [];

    for (const testStep of steps) {
      testSteps.push({
        timestamp: new Date(testStep.startTime).getTime(),
        message: testStep.error
          ? `${this.cleanseReason(testStep.error?.message)} \n ${this.cleanseReason(
            testStep.error?.stack,
          )}`
          : testStep.title,
        level: testStep.error ? 'ERROR' : 'INFO',
      });
    }

    return testSteps;
  }
}