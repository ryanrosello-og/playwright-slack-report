// get path to json
// ensure path exist
// ensure json is parsable

import * as fs from 'fs';
import ResultsParser from './src/ResultsParser';

// par
const filePath = 'tests_data.json';
const data = fs.readFileSync(filePath, 'utf-8');
const parsedData = JSON.parse(data);

console.log('🚀 ---------------------------------------------🚀');
console.log('🚀 ~ file: cli.ts:13 ~ parsedData:', parsedData);
console.log('🚀 ---------------------------------------------🚀');

const resultsParser = new ResultsParser();

x('fs');
function x(f: string) {
  console.log(f);
}
