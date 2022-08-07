export {};

declare global {
  type SummaryResults = {
    passed: number;
    failed: number;
    skipped: number;
    aborted: number;
    failures: Array<{
      test: string;
      failureReason: string;
    }>;
    meta?: Array<{ key: string; value: string }>;
    tests: Array<{
      suiteName: string;
      name: string;
      browser?: string;
      endedAt: string;
      reason: string;
      retry: number;
      startedAt: string;
      status: 'failed' | 'passed' | 'skipped' | 'aborted';
      attachments?: {
        body: string | undefined | Buffer;
        contentType: string;
        name: string;
        path: string;
      }[];
    }>;
  };
}
