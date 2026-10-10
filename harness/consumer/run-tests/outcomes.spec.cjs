const { test, expect } = require('@playwright/test');
test('run-level fixture', async () => {
  if (['timeout', 'interruption'].includes(process.env.HARNESS_RUN_FIXTURE)) {
    await new Promise(resolve => setTimeout(resolve, 20000));
  }
  expect(1).toBe(1);
});
