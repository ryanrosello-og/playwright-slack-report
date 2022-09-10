export type SummaryResults = {
  passed: number;
  failed: number;
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
