import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const paths = [
  [
    '01',
    'Connect your workspace',
    'Choose a webhook for a simple summary, or a bot for channels and failure threads.',
    '/docs/webhooks',
    'Explore Slack setup',
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
              <Link className="action-secondary" to="/docs/custom-layouts">
                Make it your own <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="install-line">
              <span aria-hidden="true">$</span>
              <code>npm i -D playwright-slack-report</code>
              <span className="install-label">READY WHEN YOU ARE</span>
            </div>
          </div>
          <div className="signal-visual" aria-label="Example Slack test report">
            <div className="visual-top">
              <span className="status-dot" /> DELIVERY PREVIEW <span>↗</span>
            </div>
            <div className="slack-preview">
              <div className="channel-header">
                <span>#</span> test-results{' '}
                <span className="channel-meta">
                  Your team's next move starts here
                </span>
              </div>
              <div className="report-header">
                <div className="report-avatar">✓</div>
                <div>
                  <strong>Playwright</strong>{' '}
                  <span className="app-tag">APP</span>
                  <small>Today at 10:42 AM</small>
                </div>
              </div>
              <h2>Run complete. You’re in the loop.</h2>
              <p className="preview-caption">E2E regression · Chromium</p>
              <div className="report-counts">
                <div>
                  <strong>128</strong>
                  <span>
                    <i className="pass-dot" /> passed
                  </span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>
                    <i className="fail-dot" /> failed
                  </span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>
                    <i className="skip-dot" /> skipped
                  </span>
                </div>
              </div>
              <div className="report-context">
                <span>
                  BRANCH <b>main</b>
                </span>
                <span>
                  BUILD <b>#482</b>
                </span>
              </div>
              <div className="thread-preview">
                <span aria-hidden="true">↳</span>
                <div>
                  <strong>2 failures in thread</strong>
                  <small>Details that help you get to the fix.</small>
                </div>
                <span aria-hidden="true">→</span>
              </div>
            </div>
            <div className="visual-bottom">
              <span>FROM TEST RUN TO TEAM CONTEXT</span>
              <span aria-hidden="true">● ───── ●</span>
            </div>
          </div>
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
