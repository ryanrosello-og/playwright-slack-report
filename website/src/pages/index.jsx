import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

const paths = [
  [
    '01',
    'Send your first report',
    'Check prerequisites, install the reporter, and choose a webhook or bot for your workspace.',
    '/docs/getting-started',
    'Start the setup guide',
  ],
  [
    '02',
    'Make the signal yours',
    'Route failures, add build context, and shape messages with custom Slack blocks.',
    '/docs/configuration',
    'Configure the reporter',
  ],
  [
    '03',
    'Bring every shard together',
    'Merge Playwright JSON reports and send one clear summary from your CI pipeline.',
    '/docs/cli',
    'Use the CLI',
  ],
];

export default function Home() {
  const reportPreviewUrl = useBaseUrl('/img/run-context-preview.png');

  return (
    <Layout
      title="Test results, right where your team works"
      description="Send Playwright test results to Slack. Set up webhooks, bots, custom layouts, and sharded CI reporting."
    >
      <main className="home">
        <section className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> PLAYWRIGHT → SLACK
            </span>
            <h1>
              Less noise.
              <br />
              More <span>signal.</span>
            </h1>
            <p className="hero-description">
              Your tests have a story to tell. Deliver the results, failures,
              and context straight to the channel where your team works.
            </p>
            <div className="hero-actions">
              <Link className="action-primary" to="/docs/getting-started">
                Get started <span aria-hidden="true">↗</span>
              </Link>
              <Link className="action-secondary" to="/docs/overview">
                Explore the features <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="install-line">
              <span aria-hidden="true">$</span>
              <code>npm i -D playwright-slack-report</code>
              <span className="install-label">READY WHEN YOU ARE</span>
            </div>
          </div>
          <figure className="report-preview">
            <a href={reportPreviewUrl} target="_blank" rel="noreferrer">
              <img
                src={reportPreviewUrl}
                width="1720"
                height="1254"
                alt="Run context custom layout preview: 128 passed, 0 failed, 0 flaky, and 2 skipped tests, with environment, branch, commit, build, owner, suite, and report links. Open full-size preview."
              />
            </a>
            <figcaption>
              Custom layout preview using sample data.{' '}
              <Link to="/docs/layout-gallery#4-run-context">
                Use the Run context layout →
              </Link>
            </figcaption>
          </figure>
        </section>
        <div className="capability-strip">
          <span>ONE RUN. THE WHOLE PICTURE.</span>
          <span>Webhooks + bots</span>
          <span>Failure threads</span>
          <span>Custom layouts</span>
          <span>Shard-ready CLI</span>
        </div>
        <section className="path-section">
          <div className="section-heading">
            <span className="eyebrow">A CLEAR PATH TO YOUR FIRST REPORT</span>
            <h2>
              Small setup.
              <br />A better feedback loop.
            </h2>
            <p>
              Start with a summary. Build up to the reporting workflow your team
              needs.
            </p>
          </div>
          <div className="path-grid">
            {paths.map(([number, title, description, to, label]) => (
              <Link key={number} className="path-card" to={to}>
                <span className="path-number">
                  {number} <span aria-hidden="true">↗</span>
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="path-link">
                  {label} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="closing-note">
          <span className="status-dot" />
          <p>
            Built for Playwright. Delivered to Slack.{' '}
            <strong>Owned by you.</strong>
          </p>
          <a href="https://github.com/ryanrosello-og/playwright-slack-report">
            Explore the source ↗
          </a>
        </section>
      </main>
    </Layout>
  );
}
