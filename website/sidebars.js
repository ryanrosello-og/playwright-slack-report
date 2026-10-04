module.exports = {
  docs: [
    'getting-started',
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
      items: ['configuration', 'cli', 'custom-layouts'],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: ['contributing', 'consumer-harness', 'website'],
    },
  ],
};
