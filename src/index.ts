export type SummaryResults = {
  passed: number;
  failed: number;
  flaky: number | undefined;
  skipped: number;
  failures: Array<failure>;
  meta?: Array<{ key: string; value: string }>;
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

export type failure = {
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
  forbidOnly: boolean;
  fullyParallel: boolean;
  globalSetup: null;
  globalTeardown: null;
  globalTimeout: number;
  grep: Grep;
  grepInvert: null;
  maxFailures: number;
  metadata: Metadata;
  preserveOutput: string;
  projects: any[];
  reporter: Array<string[]>;
  reportSlowTests: ReportSlowTests;
  rootDir: string;
  quiet: boolean;
  shard: null;
  updateSnapshots: string;
  version: string;
  workers: number;
  webServer: null;
  listOnly: boolean;
}

export interface Grep {}

export interface Metadata {
  actualWorkers: number;
}

export interface ReportSlowTests {
  max: number;
  threshold: number;
}

export interface Stats {
  startTime: Date;
  duration: number;
  expected: number;
  skipped: number;
  unexpected: number;
  flaky: number;
}

export interface Suite {
  title: string;
  file: string;
  column: number;
  line: number;
  specs: Spec[];
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
  errors: any[];
  stdout: Stdout[];
  stderr: any[];
  retry: number;
  startTime: Date;
  attachments: any[];
}

export interface Stdout {
  text: string;
}
