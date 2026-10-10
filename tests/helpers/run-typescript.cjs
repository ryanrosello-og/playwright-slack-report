// Use the same compiler as the Playwright workers so nyc can merge coverage
// from CLI subprocesses without mixing incompatible generated-code locations.
const path = require('node:path');
const { transform } = require('playwright/lib/common');

process.argv.splice(1, 1);
transform.requireOrImport(path.resolve(process.argv[1])).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
