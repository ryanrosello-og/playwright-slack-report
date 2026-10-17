const { test, expect } = require('@playwright/test');
const { writeFile } = require('node:fs/promises');

test('failure with artifacts', async ({}, info) => {
  const file = info.outputPath(`attempt-${info.retry} # screenshot.png`);
  await writeFile(file, 'fixture attachment');
  await info.attach('Screenshot', { path: file, contentType: 'image/png' });
  await info.attach('Inline body', { body: Buffer.from('not hosted'), contentType: 'text/plain' });
  expect(false).toBe(true);
});
