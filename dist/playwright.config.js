"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// playwright.config.ts
const test_1 = require("@playwright/test");
// eslint-disable-next-line import/no-unresolved, import/extensions
// import { generateCustomLayout } from './custom_block/my_block';
require('dotenv').config();
const config = {
    forbidOnly: !!process.env.CI,
    workers: 4,
    retries: 1,
    use: {
        trace: 'on',
        screenshot: 'on',
        video: 'on',
    },
    projects: [
        {
            name: 'Nightly_Regression',
            use: { ...test_1.devices['Desktop Chrome'] },
        },
    ],
    reporter: [
        [
            './src/SlackReporter.ts',
            {
                channels: ['qa-automation'],
                sendResults: 'always', // "always" , "on-failure", "off"
                maxNumberOfFailuresToShow: 0,
                showInThread: true,
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
                        value: '<https://buildkite-artifacts.playwright.dev/pw/23887/playwright-report/index.html|📊>',
                    },
                ],
            },
        ],
        ['dot'],
        ['html'],
    ],
};
exports.default = config;
//# sourceMappingURL=playwright.config.js.map