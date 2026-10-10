import { RunStatus, SummaryResults } from '.';

/** Global errors must remain visible even with a passed status override. */
export const getRunStatus = (
  summary: SummaryResults,
): RunStatus | undefined => {
  if (summary.runStatus && summary.runStatus !== 'passed')
    return summary.runStatus;
  return summary.runErrors?.length > 0 ? 'failed' : summary.runStatus;
};

/** Shared notification and channel-routing decision for reporter and CLI. */
export const hasRunFailure = (summary: SummaryResults): boolean => {
  const status = getRunStatus(summary);
  return summary.failed > 0 || (status !== undefined && status !== 'passed');
};
