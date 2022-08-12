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
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [
    [
      './src/SlackReporter.ts',
      {
        channels: ['zeb', 'pw'],
        sendResults: 'always', // "always" , "on-failure", "off"
        // layout: generateCustomLayout,
        meta: [
          {
            key: 'BUILD_NUMBER',
            value: '323332-2341',
          },
          {
            key: 'WHATEVER_ENV_VARIABLE',
            value: process.env.SOME_ENV_VARIABLE,
          },
        ],
      },
    ],
    ['dot'],
  ],
};
export default config;
