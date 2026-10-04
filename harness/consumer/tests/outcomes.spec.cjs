const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Slack reporter harness');
});

test('passing browser interaction', async ({ page }) => {
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('output')).toHaveText('Clicked');
});

test('permanent failure', async ({ page }) => {
  await expect(page.getByRole('heading')).toHaveText('Deliberate failure', { timeout: 100 });
});

test('unexpected pass', async ({ page }) => {
  test.fail(true, 'Deliberate unexpected pass');
  await expect(page.getByRole('heading')).toHaveText('Harness ready');
});

test('flaky retry', async ({ page }, info) => {
  await expect(page.getByRole('heading')).toHaveText(
    info.retry === 0 ? 'Deliberate retry failure' : 'Harness ready', { timeout: 100 },
  );
});

test.skip('explicit skip', async () => {});

test.describe.serial('serial outcomes', () => {
  test('serial failure', async ({ page }) => {
    await expect(page.getByRole('heading')).toHaveText('Deliberate serial failure', { timeout: 100 });
  });
  test('serial propagated skip', async ({ page }) => {
    await expect(page.getByRole('heading')).toHaveText('Harness ready');
  });
});
