const { test, expect } = require('@playwright/test');

test('passes on retry', async ({}, testInfo) => {
  if (process.env.HARNESS_FLAKY === 'true') expect(testInfo.retry).toBeGreaterThan(0);
});
