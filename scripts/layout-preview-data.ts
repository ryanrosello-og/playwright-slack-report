import type { SummaryResults } from '../src';
import {
  generateBuildSummary,
  generateFailureTriage,
  generateFailureArtifacts,
  generateFlakyWatch,
  generateRunContext,
} from '../custom_block/showcase';

const base: SummaryResults = {
  runStatus: 'passed',
  passed: 128,
  failed: 0,
  flaky: 0,
  skipped: 2,
  failures: [],
  flakyTests: [],
  tests: [],
  meta: [
    { key: 'Environment', value: 'Staging / EU West' },
    { key: 'Branch', value: 'release/2.8' },
    { key: 'Commit', value: 'a81c3e7' },
    { key: 'Build', value: '#1842' },
    { key: 'Owner', value: 'Checkout team' },
    { key: 'Suite', value: 'Nightly regression' },
    { key: 'Report URL', value: 'https://example.com/reports/1842' },
    { key: 'Build URL', value: 'https://example.com/builds/1842' },
  ],
};

export const layoutPreviews = [
  { id: 'build-summary', layout: generateBuildSummary, summary: base },
  {
    id: 'failure-triage',
    layout: generateFailureTriage,
    summary: {
      ...base,
      runStatus: 'failed',
      passed: 126,
      failed: 2,
      failures: [
        {
          suite: 'Checkout',
          test: 'Guest can complete payment [chromium]',
          failureReason:
            'Expected confirmation banner to be visible.\nTimed out after 5000 ms waiting for “Order confirmed”.',
        },
        {
          suite: 'Account',
          test: 'Password reset sends an email [firefox]',
          failureReason:
            'Expected HTTP 200 from /api/password-reset.\nReceived HTTP 503: service temporarily unavailable.',
        },
      ],
    } as SummaryResults,
  },
  {
    id: 'flaky-watch',
    layout: generateFlakyWatch,
    summary: {
      ...base,
      passed: 125,
      flaky: 3,
      flakyTests: [
        {
          suite: 'Search',
          test: 'Filters update results',
          projectName: 'chromium',
          retries: 1,
        },
        {
          suite: 'Checkout',
          test: 'Cart survives a page refresh',
          projectName: 'webkit',
          retries: 2,
        },
        {
          suite: 'Account',
          test: 'Profile avatar is displayed',
          projectName: 'firefox',
          retries: 1,
        },
      ],
    },
  },
  { id: 'run-context', layout: generateRunContext, summary: base },
  {
    id: 'failure-artifacts',
    layout: generateFailureArtifacts,
    summary: {
      ...base,
      runStatus: 'failed', passed: 126, failed: 2,
      meta: [{ key: 'Build URL', value: 'https://example.com/builds/1842' }],
      failures: [
        {
          suite: 'Checkout', test: 'Guest can complete payment [chromium]',
          failureReason: 'Confirmation banner was not visible after 5000 ms.',
          artifacts: [
            { name: 'HTML report', url: 'https://example.com/reports/1842/index.html' },
            { name: 'Screenshot', url: 'https://example.com/artifacts/1842/checkout/screenshot.png', contentType: 'image/png' },
            { name: 'Trace ZIP', url: 'https://example.com/artifacts/1842/checkout/trace.zip', contentType: 'application/zip' },
          ],
        },
        {
          suite: 'Account', test: 'Password reset sends an email [firefox]',
          failureReason: 'Expected HTTP 200 from /api/password-reset. Received HTTP 503.',
          artifacts: [
            { name: 'HTML report', url: 'https://example.com/reports/1842/index.html' },
            { name: 'Screenshot', url: 'https://example.com/artifacts/1842/account/screenshot.png', contentType: 'image/png' },
            { name: 'Trace ZIP', url: 'https://example.com/artifacts/1842/account/trace.zip', contentType: 'application/zip' },
          ],
        },
      ],
    } as SummaryResults,
  },
];
