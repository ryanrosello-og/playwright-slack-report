module.exports = {
  docs: [
    'overview',
    'getting-started',
    'feature-comparison',
    {
      type: 'category',
      label: 'Connect Slack',
      collapsed: false,
      items: ['webhooks', 'slack-bot'],
    },
    {
      type: 'category',
      label: 'Use the reporter',
      collapsed: false,
      items: ['configuration', 'cli', 'custom-layouts', 'layout-gallery'],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: ['contributing', 'consumer-harness', 'website'],
    },
  ],
};
