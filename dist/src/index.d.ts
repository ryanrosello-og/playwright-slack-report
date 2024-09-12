export type SummaryResults = {
    passed: number;
    failed: number;
    flaky: number | undefined;
    skipped: number;
    failures: Array<failure>;
    meta?: Meta;
    tests: Array<{
        suiteName: string;
        name: string;
        browser?: string;
        projectName?: string;
        endedAt: string;
        reason: string;
        retry: number;
        startedAt: string;
        status: 'passed' | 'failed' | 'timedOut' | 'skipped';
        attachments?: {
            body: string | undefined | Buffer;
            contentType: string;
            name: string;
            path: string;
        }[];
    }>;
};
export type Meta = Array<{
    key: string;
    value: string;
}>;
export type failure = {
    suite: string;
    test: string;
    failureReason: string;
};
export interface JSONResult {
    config: Config;
    suites: Suite[];
    errors: any[];
    stats: Stats;
}
export interface Config {
    configFile: string;
    rootDir: string;
    forbidOnly: boolean;
    fullyParallel: boolean;
    globalSetup: any;
    globalTeardown: any;
    globalTimeout: number;
    grep: Grep;
    grepInvert: any;
    maxFailures: number;
    metadata: Metadata;
    preserveOutput: string;
    reporter: [string, any][];
    reportSlowTests: ReportSlowTests;
    quiet: boolean;
    projects: Project[];
    shard: any;
    updateSnapshots: string;
    version: string;
    workers: number;
    webServer: any;
}
export interface Grep {
}
export interface Metadata {
    actualWorkers: number;
}
export interface ReportSlowTests {
    max: number;
    threshold: number;
}
export interface Project {
    outputDir: string;
    repeatEach: number;
    retries: number;
    id: string;
    name: string;
    testDir: string;
    testIgnore: any[];
    testMatch: string[];
    timeout: number;
}
export interface Suite {
    title: string;
    file: string;
    column: number;
    line: number;
    specs: Spec[];
    suites: Suites[];
}
export interface Spec {
    title: string;
    ok: boolean;
    tags: any[];
    tests: Test[];
    id: string;
    file: string;
    line: number;
    column: number;
}
export interface Test {
    timeout: number;
    annotations: any[];
    expectedStatus: string;
    projectId: string;
    projectName: string;
    results: Result[];
    status: string;
}
export interface Result {
    workerIndex: number;
    status: string;
    duration: number;
    errors: Error[];
    stdout: any[];
    stderr: any[];
    retry: number;
    startTime: string;
    attachments: Attachment[];
    error?: {
        message: string;
        stack: string;
        location: {
            file: string;
            column: number;
            line: number;
        };
        snippet: string;
    };
    errorLocation?: ErrorLocation;
}
export interface Error {
    location: Location;
    message: string;
}
export interface Location {
    file: string;
    column: number;
    line: number;
}
export interface Attachment {
    name: string;
    contentType: string;
    path: string;
}
export interface ErrorLocation {
    file: string;
    column: number;
    line: number;
}
export interface Suites {
    title: string;
    file: string;
    line: number;
    column: number;
    specs: Specs[];
}
export interface Specs {
    title: string;
    ok: boolean;
    tags: any[];
    tests: Tests[];
    id: string;
    file: string;
    line: number;
    column: number;
}
export interface Tests {
    timeout: number;
    annotations: any[];
    expectedStatus: string;
    projectId: string;
    projectName: string;
    results: Results[];
    status: string;
}
export interface Results {
    workerIndex: number;
    status: string;
    duration: number;
    error: {
        message: string;
        stack: string;
        location: {
            file: string;
            column: number;
            line: number;
        };
        snippet: string;
    };
    errors: Errors[];
    stdout: any[];
    stderr: any[];
    retry: number;
    startTime: string;
    attachments: Attachments[];
    errorLocation: {
        file: string;
        column: number;
        line: number;
    };
}
export interface Errors {
    location: {
        file: string;
        column: number;
        line: number;
    };
    message: string;
}
export interface Attachments {
    name: string;
    contentType: string;
    path: string;
}
export interface Stats {
    startTime: string;
    duration: number;
    expected: number;
    skipped: number;
    unexpected: number;
    flaky: number;
}
