import { KnownBlock, Block } from '@slack/types';
import { SummaryResults } from '.';

const generateBlocks = async (
  summaryResults: SummaryResults,
  maxNumberOfFailures: number,
): Promise<Array<KnownBlock | Block>> => {
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
      text: `✅ *${summaryResults.passed}* | ❌ *${summaryResults.failed}* |${
        summaryResults.flaky !== undefined
          ? ` 🟡 *${summaryResults.flaky}* | `
          : ' '
      }⏩ *${summaryResults.skipped}*`,
    },
  };

  const fails = await generateFailures(summaryResults, maxNumberOfFailures);

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

  return [header, summary, ...meta, ...fails];
};

const generateFailures = async (
  summaryResults: SummaryResults,
  maxNumberOfFailures: number,
): Promise<Array<KnownBlock | Block>> => {
  const maxNumberOfFailureLength = 650;
  const fails = [];

  const numberOfFailuresToShow = Math.min(
    summaryResults.failures.length,
    maxNumberOfFailures,
  );

  for (let i = 0; i < numberOfFailuresToShow; i += 1) {
    const { failureReason, test, suite } = summaryResults.failures[i];
    const formattedFailure = failureReason
      .substring(0, maxNumberOfFailureLength)
      .split('\n')
      .map((l) => `>${l}`)
      .join('\n');
    fails.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${suite} > ${test}*
        \n${formattedFailure}`,
      },
    });
  }

  if (
    maxNumberOfFailures > 0
    && summaryResults.failures.length > maxNumberOfFailures
  ) {
    fails.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚠️ There are too many failures to display - ${fails.length} out of ${summaryResults.failures.length} failures shown*`,
      },
    });
  }

  if (fails.length === 0) {
    return [];
  }

  return [
    {
      type: 'divider',
    },
    ...fails,
  ];
};

const generateFallbackText = (summaryResults: SummaryResults): string => `✅ ${summaryResults.passed} ❌ ${summaryResults.failed} ${
  summaryResults.flaky !== undefined ? ` 🟡 ${summaryResults.flaky} ` : ' '
}⏩ ${summaryResults.skipped}`;

export { generateBlocks, generateFailures, generateFallbackText };
