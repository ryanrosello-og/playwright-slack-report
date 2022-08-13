import { KnownBlock, Block } from '@slack/types';
import { SummaryResults } from '.';

const generateBlocks = async (
  summaryResults: SummaryResults,
): Promise<Array<KnownBlock | Block>> => {
  const maxNumberOfFailures = 10;
  const maxNumberOfFailureLength = 650;
  const fails = [];
  const meta = [];

  const summary = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:white_check_mark: *${
        summaryResults.passed
      }* Tests ran successfully \n\n :red_circle: *${
        summaryResults.failed
      }* Tests failed \n\n ${
        summaryResults.skipped > 0
          ? `:fast_forward: *${summaryResults.skipped}* skipped`
          : ''
      } \n\n `,
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
        \n\n${formattedFailure}`,
      },
    });
    if (i > maxNumberOfFailures) {
      fails.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*There are too many failures to display*',
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
    summary,
    ...meta,
    {
      type: 'divider',
    },
    ...fails,
  ];
};

export default generateBlocks;
