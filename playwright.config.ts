// playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';

require('dotenv').config();

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  use: {
    trace: 'on',
    screenshot: 'only-on-failure',
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
