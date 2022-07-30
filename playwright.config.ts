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
        enabled: true,
      },
    ],
  ],
};
export default config;
