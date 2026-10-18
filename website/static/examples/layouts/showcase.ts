import type { KnownBlock } from '@slack/types';
import type { SummaryResults } from 'playwright-slack-report/dist/src';

// These examples use plain text for untrusted names, metadata, and errors.
const clip = (value: string, limit = 700): string =>
  value.length > limit ? `${value.slice(0, limit - 1)}…` : value;

const heading = (text: string): KnownBlock => ({
  type: 'header',
  text: { type: 'plain_text', text, emoji: true },
});
const section = (text: string): KnownBlock => ({
  type: 'section',
  text: { type: 'plain_text', text: clip(text, 2900), emoji: true },
});
const context = (text: string): KnownBlock => ({
  type: 'context',
  elements: [{ type: 'plain_text', text: clip(text, 1900), emoji: true }],
});
const fields = (values: string[]): KnownBlock => ({
  type: 'section',
  fields: values.slice(0, 10).map((text) => ({
    type: 'plain_text',
    text: clip(text, 1900),
    emoji: true,
  })),
});
const metaValue = (summary: SummaryResults, key: string): string | undefined =>
  summary.meta?.find((item) => item.key === key)?.value;

function runOutcome(summary: SummaryResults): string {
  if (summary.runStatus === 'timedout') return '⏱ Run timed out';
  if (summary.runStatus === 'interrupted') return '⏹ Run interrupted';
  if (
    summary.failed > 0 ||
    summary.runErrors?.length ||
    summary.runStatus === 'failed'
  ) {
    return '🔴 Run failed';
  }
  if (summary.flaky) return '🟡 Passed with flaky tests';
  if (summary.passed === 0) return '⚪ No passing tests';
  return '✅ Run passed';
}

function counts(summary: SummaryResults): string {
  return `${summary.passed} passed · ${summary.failed} failed · ${summary.flaky ?? 0} flaky · ${summary.skipped} skipped`;
}

function reportLinks(summary: SummaryResults): KnownBlock[] {
  const links: string[] = [];
  for (const [key, label] of [
    ['Report URL', 'Open HTML report'],
    ['Build URL', 'View CI build'],
  ]) {
    const value = metaValue(summary, key);
    if (!value || value.length > 800) continue;
    try {
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) continue;
      const safeUrl = url.href
        .replace(/[<>|]/g, (char) => encodeURIComponent(char))
        .replace(/&/g, '&amp;');
      if (safeUrl.length > 1200) continue;
      links.push(`<${safeUrl}|${label}>`);
    } catch {
      // Missing or invalid optional links never prevent the summary being sent.
    }
  }
  return links.length
    ? [{ type: 'section', text: { type: 'mrkdwn', text: links.join('  •  ') } }]
    : [];
}

/** A compact overview for a busy CI channel. */
export function generateBuildSummary(summary: SummaryResults): KnownBlock[] {
  return [
    heading(runOutcome(summary)),
    fields([
      `✅ Passed\n${summary.passed}`,
      `🔴 Failed\n${summary.failed}`,
      `🟡 Flaky\n${summary.flaky ?? 0}`,
      `⏭ Skipped\n${summary.skipped}`,
    ]),
    { type: 'divider' },
    context(
      `Branch: ${clip(metaValue(summary, 'Branch') || 'Not supplied', 120)} · Build: ${clip(metaValue(summary, 'Build') || 'Not supplied', 120)}`,
    ),
    ...reportLinks(summary),
  ];
}

/** Keep the first global errors and failures visible without flooding the channel. */
export function generateFailureTriage(summary: SummaryResults): KnownBlock[] {
  const errors = summary.runErrors ?? [];
  const blocks: KnownBlock[] = [
    heading('🚨 Failure triage'),
    context(`${runOutcome(summary)} · ${counts(summary)}`),
    { type: 'divider' },
    ...errors
      .slice(0, 2)
      .map((error) => section(`Run error\n${clip(error, 900)}`)),
    ...summary.failures
      .slice(0, 3)
      .map((failure, index) =>
        section(
          `${index + 1}. ${clip(failure.test, 180)}\nSuite: ${clip(failure.suite, 120)}\n${clip(failure.failureReason, 700)}`,
        ),
      ),
  ];
  if (!errors.length && !summary.failures.length)
    blocks.push(section('No failure details were recorded.'));
  const omitted =
    Math.max(0, errors.length - 2) + Math.max(0, summary.failures.length - 3);
  if (omitted)
    blocks.push(
      context(
        `${omitted} more error/failure entries omitted. See the full report.`,
      ),
    );
  return [...blocks, ...reportLinks(summary)];
}

/** Hosted artifacts are resolved by artifactLinks before this layout is called. */
export function generateFailureArtifacts(
  summary: SummaryResults,
): KnownBlock[] {
  const errors = summary.runErrors ?? [];
  const blocks: KnownBlock[] = [
    heading('📎 Failure artifacts'),
    context(`${runOutcome(summary)} · ${counts(summary)}`),
    { type: 'divider' },
    ...errors
      .slice(0, 2)
      .map((error) => section(`Run error\n${clip(error, 900)}`)),
  ];
  for (const failure of summary.failures.slice(0, 3)) {
    blocks.push(
      section(
        `${clip(failure.test, 180)}\nSuite: ${clip(failure.suite, 120)}\n${clip(failure.failureReason, 500)}`,
      ),
    );
    const links: string[] = [];
    const urls = new Set<string>();
    let omitted = 0;
    for (const artifact of failure.artifacts ?? []) {
      try {
        const url = new URL(artifact.url);
        if (
          !/^https?:\/\//i.test(artifact.url) ||
          url.username ||
          url.password ||
          /[\s<>|\\]/.test(artifact.url)
        )
          continue;
        if (urls.has(url.href)) continue;
        urls.add(url.href);
        const safeUrl = url.href.replace(/&/g, '&amp;');
        const label = clip(artifact.name || 'Artifact', 80)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/[|\r\n*`_~]/g, ' ');
        const link = `<${safeUrl}|${label}>`;
        if (links.length === 3 || link.length > 900) omitted += 1;
        else links.push(link);
      } catch {
        // An invalid optional URL must not prevent the report being sent.
      }
    }
    blocks.push(
      links.length
        ? {
            type: 'section',
            text: { type: 'mrkdwn', text: links.join('  •  ') },
          }
        : context('No hosted artifact links available.'),
    );
    if (omitted)
      blocks.push(context(`${omitted} additional artifact links omitted.`));
  }
  if (!errors.length && !summary.failures.length)
    blocks.push(section('No failure details were recorded.'));
  const omitted =
    Math.max(0, errors.length - 2) + Math.max(0, summary.failures.length - 3);
  if (omitted)
    blocks.push(
      context(
        `${omitted} more error/failure entries omitted. See the full report.`,
      ),
    );
  return [...blocks, ...reportLinks(summary)];
}

/** Flaky details come from flakyTests, not from guessing based on retry counts. */
export function generateFlakyWatch(summary: SummaryResults): KnownBlock[] {
  const flaky = summary.flakyTests ?? [];
  const blocks: KnownBlock[] = [
    heading('🟡 Flaky test watch'),
    context(runOutcome(summary)),
    section(
      `${summary.flaky ?? 0} flaky tests · ${flaky.reduce((total, test) => total + test.retries, 0)} retries across recorded flaky details`,
    ),
    { type: 'divider' },
    ...flaky
      .slice(0, 4)
      .map((test) =>
        fields([
          `${clip(test.test, 180)}\n${clip(test.suite, 120)}`,
          `Project: ${clip(test.projectName || 'Not supplied', 120)}\nRetries: ${test.retries}`,
        ]),
      ),
  ];
  if (!flaky.length)
    blocks.push(section('No flaky-test details were recorded.'));
  if (flaky.length > 4)
    blocks.push(
      context(
        `${flaky.length - 4} more flaky tests omitted. See the full report.`,
      ),
    );
  return [...blocks, ...reportLinks(summary)];
}

/** A handoff card that ties a test run to its environment, revision, and artifacts. */
export function generateRunContext(summary: SummaryResults): KnownBlock[] {
  return [
    heading('📋 Run context'),
    section(`${runOutcome(summary)}\n${counts(summary)}`),
    { type: 'divider' },
    fields(
      ['Environment', 'Branch', 'Commit', 'Build', 'Owner', 'Suite'].map(
        (key) =>
          `${key}\n${clip(metaValue(summary, key) || 'Not supplied', 160)}`,
      ),
    ),
    ...reportLinks(summary),
    context(
      'Use the linked report for test details and the CI build for logs and artifacts.',
    ),
  ];
}
