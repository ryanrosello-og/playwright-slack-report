"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const ResultsParser_1 = __importDefault(require("../../src/ResultsParser"));
test_1.test.describe('ResultsParser - Parse passes', async () => {
    /**
     * Test data loaded from the file valid_test_results_by_teams.json:
     * - 2 tests pass -> @team0
     * - 2 tests flaky (1 retry) -> @team1
     * - 2 tests fail -> @team2
     * - 1 test pass & 1 test fail -> @team3
     * - 1 test pass & 1 test skipped -> @team4
     * - 2 tests are skipped -> @team5
     */
    const testResultsPath = path_1.default.join(__dirname, '../test_data', 'valid_test_results_by_teams.json');
    let resultsParser;
    test_1.test.beforeAll('Parse results from json file', async () => {
        resultsParser = new ResultsParser_1.default();
        await resultsParser.parseFromJsonFile(testResultsPath);
    });
    (0, test_1.test)('It returns 1 entry with 2 passed elements when 2 tests pass', async () => {
        const teamTestPatterns = [
            { channelName: 'team0-channel', testNamePattern: '@team0' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        test_1.expect.soft(results).toHaveLength(1);
        test_1.expect.soft(results[0].channel).toEqual(teamTestPatterns[0].channelName);
        test_1.expect.soft(results[0].team).toEqual(teamTestPatterns[0].testNamePattern);
        test_1.expect.soft(results[0].summary.tests).toHaveLength(2);
        test_1.expect.soft(results[0].summary.passed).toEqual(2);
        test_1.expect.soft(results[0].summary.flaky).toEqual(0);
        test_1.expect.soft(results[0].summary.skipped).toEqual(0);
        test_1.expect.soft(results[0].summary.failed).toEqual(0);
        test_1.expect.soft(results[0].summary.failures).toHaveLength(0);
    });
    (0, test_1.test)('It returns 1 entry with 2 elements when 2 tests are flaky', async () => {
        const teamTestPatterns = [
            { channelName: 'team1-channel', testNamePattern: '@team1' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        test_1.expect.soft(results).toHaveLength(1);
        test_1.expect.soft(results[0].channel).toEqual(teamTestPatterns[0].channelName);
        test_1.expect.soft(results[0].team).toEqual(teamTestPatterns[0].testNamePattern);
        test_1.expect.soft(results[0].summary.tests).toHaveLength(2);
        test_1.expect.soft(results[0].summary.passed).toEqual(2);
        test_1.expect.soft(results[0].summary.flaky).toEqual(0);
        test_1.expect.soft(results[0].summary.skipped).toEqual(0);
        test_1.expect.soft(results[0].summary.failed).toEqual(0);
        test_1.expect.soft(results[0].summary.failures).toHaveLength(0);
    });
    (0, test_1.test)('It returns an empty object when 2 tests fail', async () => {
        const teamTestPatterns = [
            { channelName: 'team2-channel', testNamePattern: '@team2' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        (0, test_1.expect)(results).toHaveLength(0);
    });
    (0, test_1.test)('It returns an empty object when 1 test fails and 1 test passes', async () => {
        const teamTestPatterns = [
            { channelName: 'team3-channel', testNamePattern: '@team3' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        (0, test_1.expect)(results).toHaveLength(0);
    });
    (0, test_1.test)('It returns 1 entry with 1 element when 1 test passes and 1 test is skipped', async () => {
        const teamTestPatterns = [
            { channelName: 'team4-channel', testNamePattern: '@team4' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        test_1.expect.soft(results).toHaveLength(1);
        test_1.expect.soft(results[0].channel).toEqual(teamTestPatterns[0].channelName);
        test_1.expect.soft(results[0].team).toEqual(teamTestPatterns[0].testNamePattern);
        test_1.expect.soft(results[0].summary.tests).toHaveLength(1);
        test_1.expect.soft(results[0].summary.passed).toEqual(1);
        test_1.expect.soft(results[0].summary.flaky).toEqual(0);
        test_1.expect.soft(results[0].summary.skipped).toEqual(0);
        test_1.expect.soft(results[0].summary.failed).toEqual(0);
        test_1.expect.soft(results[0].summary.failures).toHaveLength(0);
    });
    (0, test_1.test)('It returns an empty object when 2 tests are skipped', async () => {
        const teamTestPatterns = [
            { channelName: 'team5-channel', testNamePattern: '@team5' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        (0, test_1.expect)(results).toHaveLength(0);
    });
    (0, test_1.test)('It returns an empty object when pattern does not match any test', async () => {
        const teamTestPatterns = [
            { channelName: 'teamT-channel', testNamePattern: '@teamT' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        (0, test_1.expect)(results).toHaveLength(0);
    });
    (0, test_1.test)('It returns 2 entries for different test patterns with different channel names', async () => {
        const teamTestPatterns = [
            { channelName: 'team1-channel', testNamePattern: '@team1' },
            { channelName: 'team4-channel', testNamePattern: '@team4' },
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        test_1.expect.soft(results).toHaveLength(2);
        test_1.expect.soft(results[0].summary.passed).toEqual(2);
        test_1.expect.soft(results[1].summary.passed).toEqual(1);
    });
    (0, test_1.test)('It returns 2 entries for different test patterns with same channel names', async () => {
        const teamTestPatterns = [
            { channelName: 'team0-channel', testNamePattern: '@team0' }, // all passed
            { channelName: 'team0-channel', testNamePattern: '@team3' }, // 1 failed + 1 passed
            { channelName: 'team0-channel', testNamePattern: '@team4' }, // 1 skipped + 1 passed
        ];
        const results = await resultsParser.getParsedSuccessResultsByPatternWithoutFailures(teamTestPatterns);
        test_1.expect.soft(results).toHaveLength(2);
        test_1.expect.soft(results[0].summary.passed).toEqual(2);
        test_1.expect.soft(results[1].summary.passed).toEqual(1);
        test_1.expect.soft(results[0].team).toEqual(teamTestPatterns[0].testNamePattern);
        test_1.expect.soft(results[1].team).toEqual(teamTestPatterns[2].testNamePattern);
    });
});
//# sourceMappingURL=parse_success_results_by_pattern.spec.js.map