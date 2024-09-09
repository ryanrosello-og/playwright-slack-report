import { TestCase } from '@playwright/test/reporter';
import { failure, Spec, SummaryResults } from '.';
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
    private result;
    constructor();
    parseFromJsonFile(filePath: string): Promise<SummaryResults>;
    parseTestSuite(suites: any, retries: number): Promise<void>;
    parseTests(suiteName: any, specs: any, retries: number): Promise<testResult[]>;
    getFailure(snippet: string, stack: string): string;
    getExpectedFailure(test: any): any;
    getParsedResults(allTests: Array<TestCase>): Promise<SummaryResults>;
    getFailures(): Promise<Array<failure>>;
    getParsedFailureResultsByTeam(teams: Array<{
        channelName: string;
        testNamePattern: string;
    }>): Promise<Map<string, SummaryResults>>;
    static getTestName(failedTest: any): any;
    updateResults(data: {
        testSuite: any;
    }): void;
    addTestResultFromJson({ suiteName, spec, testCase, projectBrowserMapping, retries, }: {
        suiteName: any;
        spec: Spec;
        testCase: any;
        projectBrowserMapping: any;
        retries: number;
    }): void;
    addTestResult(suiteName: any, testCase: any, projectBrowserMapping: any): void;
    safelyDetermineFailure(result: {
        errors: any[];
        error: {
            message: string;
            stack: string;
        };
    }): string;
    cleanseReason(rawReason: string): string;
    determineBrowser(projectName: string, browserMappings: {
        projectName: string;
        browser: string;
    }[]): {
        projectName: string;
        browser: string;
    };
}
