import { test, expect } from '@playwright/test';

test('basic test', async ({ page }, testInfo) => {
  await testInfo.attach('screenshot', { body: 'this is a message attached to the test', contentType: 'text/plain' });
  await page.goto('https://playwright.dev/');
  const title = page.locator('.navbar__inner .navbar__title');
  await expect(title).toHaveText('Playwright');
});

test('basic test failure ', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  const title = page.locator('.navbar__inner .navbar__title');
  await expect(title).toHaveText('Playwright Fail', { timeout: 1000 });
});
