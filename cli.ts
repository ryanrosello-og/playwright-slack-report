// get path to json
// ensure path exist
// ensure json is parsable

import ResultsParser from './src/ResultsParser';

async function main(): Promise<void> {
  const filePath = 'tests_data.json';
  const resultsParser = new ResultsParser();
  await resultsParser.parseFromJsonFile(filePath);
}

// TODO:
// unit tests for parseFromJsonFile
// determine browser
// handle 'retries' << does not exist
// update test data to include failures with screenshots

(async () => main())();
