"use strict";
/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable import/extensions */
/* eslint-disable no-control-regex */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
class ResultsParser {
    result;
    constructor() {
        this.result = [];
    }
    async parseFromJsonFile(filePath) {
        let data;
        let parsedData;
        try {
            data = fs.readFileSync(filePath, 'utf-8');
            parsedData = JSON.parse(data);
        }
        catch (error) {
            throw new Error(`Error reading or parsing JSON file [${filePath}]: \n\t${error}`);
        }
        const retries = parsedData.config.projects[0]?.retries || 0;
        for (const suite of parsedData.suites) {
            // eslint-disable-next-line no-await-in-loop
            await this.parseTestSuite(suite, retries);
        }
        const failures = await this.getFailures();
        const summary = {
            passed: parsedData.stats.expected,
            failed: parsedData.stats.unexpected,
            flaky: parsedData.stats.flaky,
            skipped: parsedData.stats.skipped,
            failures,
            tests: [],
        };
        for (const suite of this.result) {
            summary.tests = summary.tests.concat(suite.testSuite.tests);
        }
        return summary;
    }
    async parseTestSuite(suites, retries) {
        let testResults = [];
        // if it has direct specs
        if (suites.specs?.length > 0) {
            testResults = await this.parseTests(suites.title, suites.specs, retries);
            this.updateResults({
                testSuite: {
                    title: suites.title ?? suites.file,
                    tests: testResults,
                },
            });
        }
        if (suites.suites?.length > 0) {
            for (const suite of suites.suites) {
                // eslint-disable-next-line no-await-in-loop
                await this.parseTestSuite(suite, retries);
            }
        }
    }
    async parseTests(suiteName, specs, retries) {
        const testResults = [];
        for (const spec of specs) {
            for (const test of spec.tests) {
                const { expectedStatus } = test;
                for (const result of test.results) {
                    testResults.push({
                        suiteName,
                        name: spec.title,
                        status: result.status === 'unexpected' ? 'failed' : result.status,
                        browser: test.projectName,
                        projectName: test.projectName,
                        retry: result.retry,
                        retries,
                        startedAt: result.startTime,
                        endedAt: new Date(new Date(result.startTime).getTime() + result.duration).toISOString(),
                        reason: result.error
                            ? this.getFailure(result.error.snippet, result.error.stack)
                            : '',
                        attachments: result.attachments,
                        expectedStatus,
                    });
                }
            }
        }
        return testResults;
    }
    getFailure(snippet, stack) {
        const fullError = `${snippet}\r\n${stack || ''}`;
        return this.cleanseReason(fullError);
    }
    getExpectedFailure(test) {
        const failureReason = test.annotations?.find((f) => f.type === 'fail');
        if (failureReason) {
            return failureReason.description;
        }
        return '';
    }
    async getParsedResults(allTests) {
        const failures = await this.getFailures();
        // use Playwright recommended way of extracting test stats:
        // https://github.com/microsoft/playwright/issues/27498#issuecomment-1766766335
        const stats = {
            expected: 0,
            skipped: 0,
            unexpected: 0,
            flaky: 0,
        };
        // eslint-disable-next-line no-plusplus
        for (const test of allTests)
            ++stats[test.outcome()];
        const summary = {
            passed: stats.expected,
            failed: stats.unexpected,
            flaky: stats.flaky,
            skipped: stats.skipped,
            failures,
            tests: [],
        };
        for (const suite of this.result) {
            summary.tests = summary.tests.concat(suite.testSuite.tests);
        }
        return summary;
    }
    async getFailures() {
        const failures = [];
        for (const suite of this.result) {
            for (const test of suite.testSuite.tests) {
                if (test.status === 'failed'
                    || test.status === 'timedOut'
                    || test.expectedStatus === 'failed') {
                    // only flag as failed if the last attempt has failed
                    if (test.retries === test.retry) {
                        failures.push({
                            suite: test.suiteName,
                            test: ResultsParser.getTestName(test),
                            failureReason: test.reason,
                        });
                    }
                }
            }
        }
        return failures;
    }
    async getParsedFailureResultsByTeam(teams) {
        const failures = await this.getFailures();
        // Initialize the map object that will contain the filtered results
        const teamsResults = new Map();
        // Filter and group failures by teams
        for (const { channelName, testNamePattern } of teams) {
            const testTeamRegexp = new RegExp(`${testNamePattern}(?:\\s|\\[)`, 'i');
            // Filter out failures that belong to the current team
            const teamFailures = failures.filter((failure) => testTeamRegexp.test(failure.test));
            if (teamFailures.length > 0) {
                // Initialize summary result for the current team
                const summary = {
                    passed: 0,
                    failed: teamFailures.length,
                    flaky: 0,
                    skipped: 0,
                    failures: teamFailures,
                    tests: teamFailures.map((failure) => ({
                        suiteName: failure.suite,
                        name: failure.test,
                        browser: undefined,
                        projectName: undefined,
                        endedAt: undefined,
                        reason: failure.failureReason,
                        retry: undefined,
                        startedAt: undefined,
                        status: 'failed',
                        attachments: undefined,
                    })),
                };
                teamsResults.set(channelName, summary);
            }
        }
        return teamsResults;
    }
    static getTestName(failedTest) {
        const testName = failedTest.name;
        if (failedTest.browser && failedTest.projectName) {
            if (failedTest.browser === failedTest.projectName) {
                return `${testName} [${failedTest.browser}]`;
            }
            return `${testName} [Project Name: ${failedTest.projectName}] using ${failedTest.browser}`;
        }
        return testName;
    }
    updateResults(data) {
        if (data.testSuite.tests.length > 0) {
            const resIndex = this.result.findIndex((res) => res.testSuite.title === data.testSuite.title);
            if (resIndex > -1) {
                for (const test of data.testSuite.tests) {
                    const testIndex = this.result[resIndex].testSuite.tests.findIndex((tes) => `${tes.projectName}${tes.name}`
                        === `${test.projectName}${test.name}`);
                    if (testIndex > -1) {
                        this.result[resIndex].testSuite.tests[testIndex] = test;
                    }
                    else {
                        this.result[resIndex].testSuite.tests.push(test);
                    }
                }
            }
            else {
                this.result.push(data);
            }
        }
    }
    addTestResultFromJson({ suiteName, spec, testCase, projectBrowserMapping, retries, }) {
        const testResults = [];
        const projectSettings = this.determineBrowser(projectBrowserMapping[0].projectName, projectBrowserMapping);
        for (const result of testCase.results) {
            testResults.push({
                suiteName,
                name: spec.title,
                status: result.status,
                browser: projectSettings.browser,
                projectName: projectSettings.projectName,
                retry: result.retry,
                retries,
                startedAt: new Date(result.startTime).toISOString(),
                endedAt: new Date(new Date(result.startTime).getTime() + result.duration).toISOString(),
                reason: this.safelyDetermineFailure(result),
                attachments: result.attachments,
            });
        }
        this.updateResults({
            testSuite: {
                title: suiteName,
                tests: testResults,
            },
        });
    }
    addTestResult(suiteName, testCase, projectBrowserMapping) {
        const testResults = [];
        const projectSettings = this.determineBrowser(testCase._projectId, projectBrowserMapping);
        for (const result of testCase.results) {
            testResults.push({
                suiteName,
                name: testCase.title,
                status: result.status,
                browser: projectSettings.browser,
                projectName: projectSettings.projectName,
                retry: result.retry,
                retries: testCase.retries,
                startedAt: new Date(result.startTime).toISOString(),
                endedAt: new Date(new Date(result.startTime).getTime() + result.duration).toISOString(),
                reason: testCase.expectedStatus === 'failed'
                    ? this.getExpectedFailure(testCase)
                    : this.safelyDetermineFailure(result),
                attachments: result.attachments,
                expectedStatus: testCase.expectedStatus,
            });
        }
        this.updateResults({
            testSuite: {
                title: suiteName,
                tests: testResults,
            },
        });
    }
    safelyDetermineFailure(result) {
        if (result.errors.length > 0) {
            const fullError = result.errors
                .map((e) => `${e.message}\r\n${e.stack ? e.stack : ''}\r\n`)
                .join();
            return this.cleanseReason(fullError);
        }
        return `${this.cleanseReason(result.error?.message)} \n ${this.cleanseReason(result.error?.stack)}`;
    }
    cleanseReason(rawReason) {
        // eslint-disable-next-line prefer-regex-literals
        const ansiRegex = new RegExp('([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))', 'g');
        const ansiCleansed = rawReason ? rawReason.replace(ansiRegex, '') : '';
        const logsStripped = ansiCleansed
            .replace(/============================================================\n/g, '')
            .replace(/============================================================\r\n/g, '')
            .replace(/=========================== logs ===========================\n/g, '');
        return logsStripped;
    }
    determineBrowser(projectName, browserMappings) {
        const browserMapping = browserMappings.find((mapping) => mapping.projectName === projectName);
        if (browserMapping) {
            return {
                projectName: browserMapping.projectName,
                browser: browserMapping.browser,
            };
        }
        return {
            projectName: '',
            browser: '',
        };
    }
}
exports.default = ResultsParser;
//# sourceMappingURL=ResultsParser.js.map