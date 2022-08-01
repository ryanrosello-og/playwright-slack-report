// playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';
// eslint-disable-next-line import/no-unresolved, import/extensions
import { generateCustomLayout } from './src/custom_block/my_block';

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
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  reporter: [
    [
      './src/SlackReporter.ts',
      {
        channels: ['zeb', 'pw'],
        sendResults: 'on-failure', // "always" , "on-failure", "off"
        layout: generateCustomLayout,
        meta: [
          {
            key: 'vsvs', value: true,
          },
          {
            key: 'BK', value: process.env.BK,
          }],
      },
    ],
  ],
};
export default config;
