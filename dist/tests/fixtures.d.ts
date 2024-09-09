import { SummaryResults } from '../src';
import SlackClient from '../src/SlackClient';
type SlackClientFixture = {
    testSlackClient: SlackClient;
    testSummaryAllTestsPassed: SummaryResults;
    testSummaryAllTestsFailed: SummaryResults;
    testSummarySomeFlaky: SummaryResults;
};
export declare const test: import("@playwright/test").TestType<import("@playwright/test").PlaywrightTestArgs & import("@playwright/test").PlaywrightTestOptions & SlackClientFixture, import("@playwright/test").PlaywrightWorkerArgs & import("@playwright/test").PlaywrightWorkerOptions>;
export {};
