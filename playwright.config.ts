// playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';
// eslint-disable-next-line import/no-unresolved, import/extensions
// import { generateCustomLayout } from './src/custom_block/my_block';

require('dotenv').config();

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  use: {
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'Nightly_Regression',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [
    [
      './src/SlackReporter.ts',
      {
        channels: ['qa-automation'],
        sendResults: 'always', // "always" , "on-failure", "off"
        maxNumberOfFailuresToShow: 0,
        // layout: generateCustomLayout,
        meta: [
          {
            key: 'BuildID',
            value: '0181ec91-6d2e-4ac9-8587-7612858a57a7',
          },
          {
            key: 'Branch',
            value: 'feat/create-secondary-account',
          },
          {
            key: 'HTML Results',
            value:
              '<https://buildkite-artifacts.playwright.dev/pw/23887/playwright-report/index.html|📊>',
          },
        ],
      },
    ],
    ['dot'],
  ],
};
export default config;
