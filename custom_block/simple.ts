import { Block, KnownBlock } from '@slack/types';
import { SummaryResults } from '../src';

export default function generateCustomLayoutSimpleExample(
  summaryResults: SummaryResults,
): Array<Block | KnownBlock> {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          summaryResults.failed === 0 &&
          (!summaryResults.runStatus ||
            summaryResults.runStatus === 'passed') &&
          !summaryResults.runErrors?.length
            ? ':tada: All tests passed!'
            : `⚠️ Run ${summaryResults.runStatus && summaryResults.runStatus !== 'passed' ? summaryResults.runStatus : 'failed'}: ${summaryResults.failed} failure(s) out of ${summaryResults.tests.length} tests; ${summaryResults.runErrors?.length || 0} global error(s)`,
      },
    },
  ];
}
