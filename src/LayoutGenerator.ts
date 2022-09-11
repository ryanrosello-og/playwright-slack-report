import { KnownBlock, Block } from '@slack/types';
import { SummaryResults } from '.';

const generateBlocks = async (
  summaryResults: SummaryResults,
  maxNumberOfFailures: number,
): Promise<Array<KnownBlock | Block>> => {
  const maxNumberOfFailureLength = 650;
  const fails = [];
  const meta = [];
  const header = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '🎭 *Playwright Results*',
    },
  };
  const summary = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `✅ *${summaryResults.passed}* | ❌ *${summaryResults.failed}* | ⏩ *${summaryResults.skipped}*`,
    },
  };

  for (let i = 0; i < summaryResults.failures.length; i += 1) {
    const { failureReason, test } = summaryResults.failures[i];
    const formattedFailure = failureReason
      .substring(0, maxNumberOfFailureLength)
      .split('\n')
      .map((l) => `>${l}`)
      .join('\n');
    fails.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${test}*
        \n${formattedFailure}`,
      },
    });
    if (i > maxNumberOfFailures) {
      fails.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*There are too many failures to display - ${fails.length} out of ${summaryResults.failures.length} failures shown*`,
        },
      });
      break;
    }
  }

  if (summaryResults.meta) {
    for (let i = 0; i < summaryResults.meta.length; i += 1) {
      const { key, value } = summaryResults.meta[i];
      meta.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\n*${key}* :\t${value}`,
        },
      });
    }
  }

  return [
    header,
    summary,
    ...meta,
    {
      type: 'divider',
    },
    ...fails,
  ];
};

export default generateBlocks;
