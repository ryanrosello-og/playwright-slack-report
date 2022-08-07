const generateCustomLayout = (summaryResults: {
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
}) => {
  const maxNumberOfFailures = 10;
  const maxNumberOfFailureLength = 650;
  const fails = [];
  const meta = [];

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
          text: '*There are too many failures to display, view the full results in BuildKite*',
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

  const testWithStringAttachment = summaryResults.tests.filter(
    (t) => t.attachments,
  )[0];

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '**Thisi is cusomter block**',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `**The first test is:**\n${summaryResults.tests[0].name}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `**Test with attachment:**\n${testWithStringAttachment?.attachments
          ?.filter((a) => a.contentType === 'text/plain')
          .map((a) => a.body?.toString())}`,
      },
    },
    ...meta,
    {
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
        } \n\n ${
          summaryResults.aborted > 0
            ? `:exclamation: *${summaryResults.aborted}* aborted`
            : ''
        }`,
      },
    },
    {
      type: 'divider',
    },
    ...fails,
  ];
};

// eslint-disable-next-line import/prefer-default-export
export { generateCustomLayout };
