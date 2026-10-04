const { themes } = require('prism-react-renderer');

module.exports = {
  title: 'Playwright Slack Report',
  tagline: 'Test results, right where your team works.',
  favicon: 'img/mark.svg',
  url: 'https://ryanrosello-og.github.io',
  baseUrl: '/playwright-slack-report/',
  organizationName: 'ryanrosello-og',
  projectName: 'playwright-slack-report',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: { format: 'md', hooks: { onBrokenMarkdownLinks: 'throw' } },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/ryanrosello-og/playwright-slack-report/edit/main/website/',
        },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      },
    ],
  ],
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],
  themeConfig: {
    image: 'img/report-preview.png',
    colorMode: { defaultMode: 'dark', respectPrefersColorScheme: false },
    navbar: {
      title: 'playwright / slack',
      logo: { alt: 'Playwright Slack Report', src: 'img/mark.svg' },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          label: 'Documentation',
          position: 'left',
        },
        { to: '/docs/cli', label: 'CLI', position: 'left' },
        {
          href: 'https://github.com/ryanrosello-og/playwright-slack-report',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'BUILD WITH IT',
          items: [
            { label: 'Get started', to: '/docs/getting-started' },
            { label: 'Configuration', to: '/docs/configuration' },
            { label: 'Custom layouts', to: '/docs/custom-layouts' },
          ],
        },
        {
          title: 'MAKE IT BETTER',
          items: [
            { label: 'Contributing', to: '/docs/contributing' },
            {
              label: 'Report an issue',
              href: 'https://github.com/ryanrosello-og/playwright-slack-report/issues',
            },
            {
              label: 'Source code',
              href: 'https://github.com/ryanrosello-og/playwright-slack-report',
            },
          ],
        },
      ],
      copyright: 'Playwright Slack Report · Open source, MIT licensed.',
    },
    prism: {
      theme: themes.github,
      darkTheme: themes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml'],
    },
  },
};
