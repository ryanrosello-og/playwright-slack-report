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
        reporterBaseUrl: 'https://default.zebrunner.com',
        projectKey: 'DEF',
        enabled: true,
        concurrentTasks: 19,
      },
    ],
  ],
};
export default config;
