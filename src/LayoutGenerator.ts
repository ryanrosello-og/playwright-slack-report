import { KnownBlock, Block } from '@slack/types';
import { SummaryResults } from '.';
import { getRunStatus } from './RunResults';

const unsuccessfulRunLabel = (summaryResults: SummaryResults): string => {
  const status = getRunStatus(summaryResults);
  if (!status || status === 'passed') return '';
  return status === 'timedout' ? 'timed out' : status;
};

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

  const runLabel = unsuccessfulRunLabel(summaryResults);
  const run = runLabel ? [{
    type: 'section',
    text: { type: 'mrkdwn', text: `*Run status: ${runLabel}*` },
  }] : [];
  return [header, summary, ...run, ...meta, ...fails];
};

const generateFailures = async (
  summaryResults: SummaryResults,
  maxNumberOfFailures: number,
): Promise<Array<KnownBlock | Block>> => {
  const maxNumberOfFailureLength = 650;
  const fails = [];

  const details = [
    ...(summaryResults.runErrors || []).map((failureReason) => ({
      suite: 'Run-level error', test: '', failureReason,
    })),
    ...summaryResults.failures,
  ];
  const numberOfFailuresToShow = Math.min(
    details.length,
    maxNumberOfFailures,
  );

  for (let i = 0; i < numberOfFailuresToShow; i += 1) {
    const { failureReason, test, suite } = details[i];
    const formattedFailure = failureReason
      .substring(0, maxNumberOfFailureLength)
      .split('\n')
      .map((l) => `>${l}`)
      .join('\n');
    fails.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${test ? `${suite} > ${test}` : suite}*
        \n${formattedFailure}`,
      },
    });
  }

  if (
    maxNumberOfFailures > 0
    && details.length > maxNumberOfFailures
  ) {
    fails.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*⚠️ There are too many failures to display - ${fails.length} out of ${details.length} failures shown*`,
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

const generateFallbackText = (summaryResults: SummaryResults): string => {
  const runLabel = unsuccessfulRunLabel(summaryResults);
  return `${runLabel ? `Run status: ${runLabel}. ` : ''}✅ ${summaryResults.passed} ❌ ${summaryResults.failed} ${
    summaryResults.flaky !== undefined ? ` 🟡 ${summaryResults.flaky} ` : ' '
  }⏩ ${summaryResults.skipped}`;
};

export { generateBlocks, generateFailures, generateFallbackText };
