import { TestCase } from '@playwright/test/reporter';
import { failure, Spec, success, SummaryResults, TestStatusType } from '.';
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
    private readonly result;
    constructor();
    parseFromJsonFile(filePath: string): Promise<SummaryResults>;
    parseTestSuite(suites: any, retries: number): Promise<void>;
    parseTests(suiteName: any, specs: any, retries: number): Promise<testResult[]>;
    getFailure(snippet: string, stack: string): string;
    getExpectedFailure(test: any): any;
    getParsedResults(allTests: Array<TestCase>): Promise<SummaryResults>;
    getFailures(): Promise<Array<failure>>;
    /**
     * Retrieves a list of passed tests from the test results.
     *
     * @returns A promise that resolves to an array of objects representing the passed tests.
     * Each object contains the suite name and the test name.
     */
    getPasses(): Promise<Array<success>>;
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
    getParsedFailureResultsByPattern(channelAndTestPatternArray: Array<{
        channelName: string;
        testNamePattern: string;
    }>): Promise<Array<{
        channel: string;
        team: string;
        summary: SummaryResults;
    }>>;
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
    filterParsedSuccessResultsByPattern(channelAndTestPatternArray: Array<{
        channelName: string;
        testNamePattern: string;
    }>): Promise<Array<{
        channel: string;
        team: string;
        summary: SummaryResults;
    }>>;
    /**
     * Retrieves parsed success results by pattern,
     * excluding any pattern (team) that have failures.
     *
     * @param channelAndTestPatternArray - An array of objects containing channel names
     *        and test name patterns.
     * @returns A promise that resolves to a Map where the keys are channel names
     *          and the values are summary results, excluding channels that have any failed tests.
     */
    getParsedSuccessResultsByPatternWithoutFailures(channelAndTestPatternArray: Array<{
        channelName: string;
        testNamePattern: string;
    }>): Promise<Array<{
        channel: string;
        team: string;
        summary: SummaryResults;
    }>>;
    static getTestName(test: Partial<testResult>): string;
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
    parseTestPatterns(channelAndTestPatternArray: Array<{
        channelName: string;
        testNamePattern: string;
    }>): Array<{
        channelName: string;
        testNamePattern: string;
    }>;
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
