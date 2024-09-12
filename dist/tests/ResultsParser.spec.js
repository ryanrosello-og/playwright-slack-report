"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const path_1 = __importDefault(require("path"));
const ResultsParser_1 = __importDefault(require("../src/ResultsParser"));
const test = test_1.test.extend({
    testData: {
        title: '',
        suites: [
            {
                title: 'chrome',
                suites: [
                    {
                        title: 'tests/t1.spec.ts',
                        suites: [],
                        tests: [
                            {
                                title: 'basic test failure ',
                                results: [
                                    {
                                        retry: 0,
                                        duration: 23591,
                                        startTime: 'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
                                        attachments: [
                                            {
                                                name: 'screenshot',
                                                path: undefined,
                                                contentType: 'text/plain',
                                                body: new Uint8Array([
                                                    116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 109,
                                                    101, 115, 115, 97, 103, 101, 32, 97, 116, 116, 97, 99,
                                                    104, 101, 100, 32, 116, 111, 32, 116, 104, 101, 32,
                                                    116, 101, 115, 116,
                                                ]),
                                            },
                                            {
                                                name: 'video',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/video.webm',
                                                contentType: 'video/webm',
                                                body: undefined,
                                            },
                                            {
                                                name: 'trace',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/trace.zip',
                                                contentType: 'application/zip',
                                                body: undefined,
                                            },
                                            {
                                                name: 'screenshot',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/test-failed-1.png',
                                                contentType: 'image/png',
                                                body: undefined,
                                            },
                                        ],
                                        status: 'failed',
                                        errors: [
                                            {
                                                message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                                stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                            },
                                        ],
                                        error: {
                                            message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                            stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                        },
                                    },
                                ],
                                location: {
                                    file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                                    line: 9,
                                    column: 1,
                                },
                                expectedStatus: 'passed',
                                _projectId: 'playwright-slack-report',
                            },
                        ],
                        location: {
                            file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                            line: 0,
                            column: 0,
                        },
                    },
                ],
            },
            {
                title: 'chrome',
                suites: [
                    {
                        title: 'tests/t1.spec.ts',
                        suites: [],
                        tests: [
                            {
                                title: 'basic test failure 2',
                                status: 'failed',
                                retries: 0,
                                results: [
                                    {
                                        retry: 0,
                                        duration: 23522,
                                        startTime: 'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
                                        attachments: [
                                            {
                                                name: 'screenshot',
                                                path: undefined,
                                                contentType: 'text/plain',
                                                body: new Uint8Array([
                                                    116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 109,
                                                    101, 115, 115, 97, 103, 101, 32, 97, 116, 116, 97, 99,
                                                    104, 101, 100, 32, 116, 111, 32, 116, 104, 101, 32,
                                                    116, 101, 115, 116,
                                                ]),
                                            },
                                            {
                                                name: 'video',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/video.webm',
                                                contentType: 'video/webm',
                                                body: undefined,
                                            },
                                            {
                                                name: 'trace',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/trace.zip',
                                                contentType: 'application/zip',
                                                body: undefined,
                                            },
                                            {
                                                name: 'screenshot',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/test-failed-1.png',
                                                contentType: 'image/png',
                                                body: undefined,
                                            },
                                        ],
                                        status: 'failed',
                                        errors: [
                                            {
                                                message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                                stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                            },
                                        ],
                                        error: {
                                            message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                            stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                        },
                                    },
                                ],
                                location: {
                                    file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                                    line: 9,
                                    column: 1,
                                },
                                expectedStatus: 'passed',
                            },
                        ],
                        location: {
                            file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                            line: 0,
                            column: 0,
                        },
                    },
                ],
            },
            {
                title: 'chrome',
                suites: [
                    {
                        title: 'tests/t1.spec.ts',
                        suites: [],
                        tests: [
                            {
                                title: 'flaky test 1',
                                status: 'failed',
                                retries: 1,
                                results: [
                                    {
                                        retry: 0,
                                        duration: 23522,
                                        startTime: 'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
                                        attachments: [
                                            {
                                                name: 'screenshot',
                                                path: undefined,
                                                contentType: 'text/plain',
                                                body: new Uint8Array([
                                                    116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 109,
                                                    101, 115, 115, 97, 103, 101, 32, 97, 116, 116, 97, 99,
                                                    104, 101, 100, 32, 116, 111, 32, 116, 104, 101, 32,
                                                    116, 101, 115, 116,
                                                ]),
                                            },
                                            {
                                                name: 'video',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/video.webm',
                                                contentType: 'video/webm',
                                                body: undefined,
                                            },
                                            {
                                                name: 'trace',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/trace.zip',
                                                contentType: 'application/zip',
                                                body: undefined,
                                            },
                                            {
                                                name: 'screenshot',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/test-failed-1.png',
                                                contentType: 'image/png',
                                                body: undefined,
                                            },
                                        ],
                                        status: 'failed',
                                        errors: [
                                            {
                                                message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                                stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                            },
                                        ],
                                        error: {
                                            message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                            stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                        },
                                    },
                                ],
                                location: {
                                    file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                                    line: 9,
                                    column: 1,
                                },
                                expectedStatus: 'failed',
                            },
                            {
                                title: 'flaky test 1',
                                status: 'passed',
                                retries: 1,
                                results: [
                                    {
                                        retry: 1,
                                        duration: 23522,
                                        startTime: 'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
                                        attachments: [
                                            {
                                                name: 'screenshot',
                                                path: undefined,
                                                contentType: 'text/plain',
                                                body: new Uint8Array([
                                                    116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 109,
                                                    101, 115, 115, 97, 103, 101, 32, 97, 116, 116, 97, 99,
                                                    104, 101, 100, 32, 116, 111, 32, 116, 104, 101, 32,
                                                    116, 101, 115, 116,
                                                ]),
                                            },
                                            {
                                                name: 'video',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/video.webm',
                                                contentType: 'video/webm',
                                                body: undefined,
                                            },
                                            {
                                                name: 'trace',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/trace.zip',
                                                contentType: 'application/zip',
                                                body: undefined,
                                            },
                                            {
                                                name: 'screenshot',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/test-failed-1.png',
                                                contentType: 'image/png',
                                                body: undefined,
                                            },
                                        ],
                                        status: 'passed',
                                        errors: [
                                            {
                                                message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                                stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                            },
                                        ],
                                        error: {
                                            message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                            stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                        },
                                    },
                                ],
                                location: {
                                    file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                                    line: 9,
                                    column: 1,
                                },
                                expectedStatus: 'passed',
                            },
                            {
                                title: 'passed test 1',
                                status: 'passed',
                                retries: 0,
                                results: [
                                    {
                                        retry: 0,
                                        duration: 23522,
                                        startTime: 'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
                                        attachments: [
                                            {
                                                name: 'screenshot',
                                                path: undefined,
                                                contentType: 'text/plain',
                                                body: new Uint8Array([
                                                    116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 109,
                                                    101, 115, 115, 97, 103, 101, 32, 97, 116, 116, 97, 99,
                                                    104, 101, 100, 32, 116, 111, 32, 116, 104, 101, 32,
                                                    116, 101, 115, 116,
                                                ]),
                                            },
                                            {
                                                name: 'video',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/video.webm',
                                                contentType: 'video/webm',
                                                body: undefined,
                                            },
                                            {
                                                name: 'trace',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/trace.zip',
                                                contentType: 'application/zip',
                                                body: undefined,
                                            },
                                            {
                                                name: 'screenshot',
                                                path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/test-failed-1.png',
                                                contentType: 'image/png',
                                                body: undefined,
                                            },
                                        ],
                                        status: 'passed',
                                        errors: [
                                            {
                                                message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                                stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                            },
                                        ],
                                        error: {
                                            message: '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                                            stack: 'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                                        },
                                    },
                                ],
                                location: {
                                    file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                                    line: 9,
                                    column: 1,
                                },
                                expectedStatus: 'passed',
                            },
                        ],
                        location: {
                            file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                            line: 0,
                            column: 0,
                        },
                    },
                ],
            },
        ],
    },
});
test.describe('ResultsParser', () => {
    test('determines correct browser based on project config', async ({ testData, }) => {
        const resultsParser = new ResultsParser_1.default();
        resultsParser.addTestResult(testData.suites[0].suites[0].title, testData.suites[0].suites[0].tests[0], [
            {
                projectName: 'ui',
                browser: 'webkit',
            },
            {
                projectName: 'playwright-slack-report',
                browser: 'chrome',
            },
        ]);
        const results = await resultsParser.getParsedResults([]);
        (0, test_1.expect)(results.tests[0].projectName).toEqual('playwright-slack-report');
        (0, test_1.expect)(results.tests[0].browser).toEqual('chrome');
    });
    test('parses results successfully', async ({ testData }) => {
        const resultsParser = new ResultsParser_1.default();
        resultsParser.addTestResult(testData.suites[0].suites[0].title, testData.suites[0].suites[0].tests[0], []);
        const testA = {
            expectedStatus: 'passed',
            ok() {
                throw new Error('Function not implemented.');
            },
            outcome() {
                return 'unexpected';
            },
            titlePath() {
                throw new Error('Function not implemented.');
            },
            annotations: [],
            id: '',
            location: undefined,
            parent: undefined,
            repeatEachIndex: 0,
            results: [],
            retries: 0,
            timeout: 0,
            title: '',
            tags: [],
            type: 'test',
        };
        const results = await resultsParser.getParsedResults([testA]);
        (0, test_1.expect)(results).toEqual({
            passed: 0,
            failed: 1,
            flaky: 0,
            skipped: 0,
            failures: [],
            tests: [
                {
                    suiteName: 'tests/t1.spec.ts',
                    name: 'basic test failure ',
                    status: 'failed',
                    browser: '',
                    projectName: '',
                    retry: 0,
                    retries: undefined,
                    startedAt: '2021-12-18T09:43:16.000Z',
                    endedAt: '2021-12-18T09:43:39.591Z',
                    expectedStatus: 'passed',
                    reason: 'expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\r\nError: expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23\r\n',
                    attachments: [
                        {
                            name: 'screenshot',
                            path: undefined,
                            contentType: 'text/plain',
                            body: new Uint8Array([
                                116, 104, 105, 115, 32, 105, 115, 32, 97, 32, 109, 101, 115,
                                115, 97, 103, 101, 32, 97, 116, 116, 97, 99, 104, 101, 100, 32,
                                116, 111, 32, 116, 104, 101, 32, 116, 101, 115, 116,
                            ]),
                        },
                        {
                            name: 'video',
                            path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/video.webm',
                            contentType: 'video/webm',
                            body: undefined,
                        },
                        {
                            name: 'trace',
                            path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/trace.zip',
                            contentType: 'application/zip',
                            body: undefined,
                        },
                        {
                            name: 'screenshot',
                            path: '/home/ry/_repo/playwright-slack-report/test-results/tests-t1-basic-test-failure--chrome/test-failed-1.png',
                            contentType: 'image/png',
                            body: undefined,
                        },
                    ],
                },
            ],
        });
    });
    test('getTestName(...) generates correct test name', async ({}) => {
        (0, test_1.expect)(ResultsParser_1.default.getTestName({ name: 'Login' })).toEqual('Login');
        (0, test_1.expect)(ResultsParser_1.default.getTestName({
            name: 'Login',
            browser: 'chrome',
            projectName: 'chrome',
        })).toEqual('Login [chrome]');
        (0, test_1.expect)(ResultsParser_1.default.getTestName({
            name: 'Login',
            browser: 'chrome',
            projectName: 'nightly_regression',
        })).toEqual('Login [Project Name: nightly_regression] using chrome');
    });
    test('parse test results from json file that has retries, flakies and skipped tests', async ({}) => {
        const resultsParser = new ResultsParser_1.default();
        const validTestResults = path_1.default.join(__dirname, 'test_data', 'valid_test_results.json');
        const resultSummary = await resultsParser.parseFromJsonFile(validTestResults);
        (0, test_1.expect)(resultSummary.failed).toEqual(3);
        (0, test_1.expect)(resultSummary.flaky).toEqual(1);
        (0, test_1.expect)(resultSummary.skipped).toEqual(1);
        (0, test_1.expect)(resultSummary.passed).toEqual(2);
        (0, test_1.expect)(resultSummary.failures.length).toEqual(3);
        (0, test_1.expect)(resultSummary.tests.length).toEqual(10);
    });
    test('throw an error when the results file is not a valid json', async ({}) => {
        const resultsParser = new ResultsParser_1.default();
        const validTestResults = path_1.default.join(__dirname, 'test_data', 'invalid_json_results.json');
        try {
            await resultsParser.parseFromJsonFile(validTestResults);
        }
        catch (error) {
            (0, test_1.expect)(error.toString()).toContain('Error: Error reading or parsing JSON file');
        }
    });
    test('parse test results from a complicated json file', async ({}) => {
        const resultsParser = new ResultsParser_1.default();
        const validTestResults = path_1.default.join(__dirname, 'test_data', 'valid_test_results_complex.json');
        const resultSummary = await resultsParser.parseFromJsonFile(validTestResults);
        (0, test_1.expect)(resultSummary.failed).toEqual(1);
        (0, test_1.expect)(resultSummary.flaky).toEqual(0);
        (0, test_1.expect)(resultSummary.skipped).toEqual(0);
        (0, test_1.expect)(resultSummary.passed).toEqual(6);
        (0, test_1.expect)(resultSummary.failures.length).toEqual(1);
        (0, test_1.expect)(resultSummary.tests.length).toEqual(7);
    });
    test('retrieve expected failure message from annotation', async ({}) => {
        const resultsParser = new ResultsParser_1.default();
        const result = resultsParser.getExpectedFailure({
            annotations: [{ type: 'fail', description: 'This text will fail' }],
        });
        (0, test_1.expect)(result).toEqual('This text will fail');
    });
    test('empty failure message returned if annotation does not exist', async ({}) => {
        const resultsParser = new ResultsParser_1.default();
        const result = resultsParser.getExpectedFailure({});
        (0, test_1.expect)(result).toEqual('');
    });
});
//# sourceMappingURL=ResultsParser.spec.js.map