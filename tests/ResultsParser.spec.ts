import { expect, test as base } from '@playwright/test';
import { TestCase } from '@playwright/test/reporter';
import path from 'path';
import ResultsParser from '../src/ResultsParser';

const test = base.extend<{ testData: any }>({
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
                    startTime:
                      'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
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
                        message:
                          '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                        stack:
                          'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                      },
                    ],
                    error: {
                      message:
                        '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                      stack:
                        'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
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
                    startTime:
                      'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
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
                        message:
                          '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                        stack:
                          'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                      },
                    ],
                    error: {
                      message:
                        '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                      stack:
                        'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
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
                    startTime:
                      'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
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
                        message:
                          '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                        stack:
                          'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                      },
                    ],
                    error: {
                      message:
                        '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                      stack:
                        'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
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
                    startTime:
                      'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
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
                        message:
                          '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                        stack:
                          'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                      },
                    ],
                    error: {
                      message:
                        '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                      stack:
                        'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
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
                    startTime:
                      'Sat Dec 18 2021 19:43:16 GMT+1000 (Australian Eastern Standard Time)',
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
                        message:
                          '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                        stack:
                          'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
                      },
                    ],
                    error: {
                      message:
                        '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n',
                      stack:
                        'Error: \u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m).\u001b[22mtoHaveText\u001b[2m(\u001b[22m\u001b[32mexpected\u001b[39m\u001b[2m)\u001b[22m\n\nExpected string: \u001b[32m"Playwright\u001b[7m Fail\u001b[27m"\u001b[39m\nReceived string: \u001b[31m"Playwright"\u001b[39m\nCall log:\n  \u001b[2m- expect.toHaveText with timeout 1000ms\u001b[22m\n\u001b[2m  - waiting for selector ".navbar__inner .navbar__title"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\u001b[2m  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\u001b[22m\n\u001b[2m  -   unexpected value "Playwright"\u001b[22m\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
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
  test('determines correct browser based on project config', async ({
    testData,
  }) => {
    const resultsParser = new ResultsParser();
    resultsParser.addTestResult(
      testData.suites[0].suites[0].title,
      testData.suites[0].suites[0].tests[0],
      [
        {
          projectName: 'ui',
          browser: 'webkit',
        },
        {
          projectName: 'playwright-slack-report',
          browser: 'chrome',
        },
      ],
    );
    const results = await resultsParser.getParsedResults([]);
    expect(results.tests[0].projectName).toEqual('playwright-slack-report');
    expect(results.tests[0].browser).toEqual('chrome');
  });

  test('parses results successfully', async ({ testData }) => {
    const resultsParser = new ResultsParser();
    resultsParser.addTestResult(
      testData.suites[0].suites[0].title,
      testData.suites[0].suites[0].tests[0],
      [],
    );
    const testA: TestCase = {
      expectedStatus: 'passed',
      ok(): boolean {
        throw new Error('Function not implemented.');
      },
      outcome(): 'skipped' | 'expected' | 'unexpected' | 'flaky' {
        return 'unexpected';
      },
      titlePath(): string[] {
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
    expect(results).toEqual({
      passed: 0,
      failed: 1,
      flaky: 0,
      skipped: 0,
      failures: [],
      tests: [
        {
          file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
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
          reason:
            'expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\r\nError: expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23\r\n',
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
    expect(ResultsParser.getTestName({ name: 'Login' })).toEqual('Login');
    expect(
      ResultsParser.getTestName({
        name: 'Login',
        browser: 'chrome',
        projectName: 'chrome',
      }),
    ).toEqual('Login [chrome]');
    expect(
      ResultsParser.getTestName({
        name: 'Login',
        browser: 'chrome',
        projectName: 'nightly_regression',
      }),
    ).toEqual('Login [Project Name: nightly_regression] using chrome');
  });

  test('parse test results from json file that has retries, flakies and skipped tests', async ({}) => {
    const resultsParser = new ResultsParser();
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results.json',
    );
    const resultSummary
      = await resultsParser.parseFromJsonFile(validTestResults);
    expect(resultSummary.failed).toEqual(3);
    expect(resultSummary.flaky).toEqual(1);
    expect(resultSummary.skipped).toEqual(1);
    expect(resultSummary.passed).toEqual(2);
    expect(resultSummary.failures.length).toEqual(3);
    expect(resultSummary.tests.length).toEqual(10);
  });

  test('throw an error when the results file is not a valid json', async ({}) => {
    const resultsParser = new ResultsParser();
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'invalid_json_results.json',
    );
    try {
      await resultsParser.parseFromJsonFile(validTestResults);
    } catch (error) {
      expect(error.toString()).toContain(
        'Error: Error reading or parsing JSON file',
      );
    }
  });

  test('parse test results from a complicated json file', async ({}) => {
    const resultsParser = new ResultsParser();
    const validTestResults = path.join(
      __dirname,
      'test_data',
      'valid_test_results_complex.json',
    );
    const resultSummary
      = await resultsParser.parseFromJsonFile(validTestResults);
    expect(resultSummary.failed).toEqual(1);
    expect(resultSummary.flaky).toEqual(0);
    expect(resultSummary.skipped).toEqual(0);
    expect(resultSummary.passed).toEqual(6);
    expect(resultSummary.failures.length).toEqual(1);
    expect(resultSummary.tests.length).toEqual(7);
  });

  test('retrieve expected failure message from annotation', async ({}) => {
    const resultsParser = new ResultsParser();
    const result = resultsParser.getExpectedFailure({
      annotations: [{ type: 'fail', description: 'This text will fail' }],
    });
    expect(result).toEqual('This text will fail');
  });

  test('empty failure message returned if annotation does not exist', async ({}) => {
    const resultsParser = new ResultsParser();
    const result = resultsParser.getExpectedFailure({});
    expect(result).toEqual('');
  });

  // Tests for CLI mode retry logic fix
  test('parseTests calculates effective retries correctly for flaky tests', async ({}) => {
    const resultsParser = new ResultsParser();

    // Mock test data representing a flaky test (failed on retry 0, passed on retry 1)
    const mockSpecs = [
      {
        title: 'Flaky Test',
        tests: [
          {
            projectName: 'chrome',
            location: {
              file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
              line: 9,
              column: 1,
            },
            results: [
              {
                retry: 0,
                status: 'failed',
                duration: 1000,
                startTime: '2023-01-01T00:00:00.000Z',
                error: {
                  snippet: 'Test failed on first attempt',
                  stack: 'Error stack trace',
                },
              },
              {
                retry: 1,
                status: 'passed',
                duration: 1000,
                startTime: '2023-01-01T00:00:01.000Z',
              },
            ],
          },
        ],
      },
    ];

    const testResults = await resultsParser.parseTests('Test Suite', mockSpecs, 0);

    // Both results should have effectiveRetries = 1 (max retry attempt)
    expect(testResults).toHaveLength(2);
    expect(testResults[0].retries).toBe(1); // Failed attempt with effective retries
    expect(testResults[0].retry).toBe(0);
    expect(testResults[0].status).toBe('failed');

    expect(testResults[1].retries).toBe(1); // Passed attempt with effective retries
    expect(testResults[1].retry).toBe(1);
    expect(testResults[1].status).toBe('passed');
  });

  test('parseTests handles single failure correctly', async ({}) => {
    const resultsParser = new ResultsParser();

    // Mock test data representing a true failure (no retries)
    const mockSpecs = [
      {
        title: 'Failed Test',
        tests: [
          {
            projectName: 'chrome',
            location: {
              file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
              line: 9,
              column: 1,
            },
            results: [
              {
                retry: 0,
                status: 'failed',
                duration: 1000,
                startTime: '2023-01-01T00:00:00.000Z',
                error: {
                  snippet: 'Test failed',
                  stack: 'Error stack trace',
                },
              },
            ],
          },
        ],
      },
    ];

    const testResults = await resultsParser.parseTests('Test Suite', mockSpecs, 0);

    // Should have retries = 0 (max retry attempt = 0, global retries = 0)
    expect(testResults).toHaveLength(1);
    expect(testResults[0].retries).toBe(0);
    expect(testResults[0].retry).toBe(0);
    expect(testResults[0].status).toBe('failed');
  });

  test('parseTests uses global retries when higher than actual retries', async ({}) => {
    const resultsParser = new ResultsParser();

    // Mock test data with global retries higher than actual attempts
    const mockSpecs = [
      {
        title: 'Test with High Global Retries',
        tests: [
          {
            projectName: 'chrome',
            location: {
              file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
              line: 9,
              column: 1,
            },
            results: [
              {
                retry: 0,
                status: 'passed',
                duration: 1000,
                startTime: '2023-01-01T00:00:00.000Z',
              },
            ],
          },
        ],
      },
    ];

    const testResults = await resultsParser.parseTests('Test Suite', mockSpecs, 3);

    // Should use global retries (3) since it's higher than max retry attempt (0)
    expect(testResults).toHaveLength(1);
    expect(testResults[0].retries).toBe(3);
    expect(testResults[0].retry).toBe(0);
    expect(testResults[0].status).toBe('passed');
  });

  test('getFailures excludes flaky tests correctly with fix', async ({}) => {
    const resultsParser = new ResultsParser();

    // Add a flaky test (failed on retry 0, passed on retry 1) using parseTestSuite
    await resultsParser.parseTestSuite({
      title: 'Flaky Suite',
      specs: [
        {
          title: 'Flaky Test',
          tests: [
            {
              projectName: 'chrome',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 1000,
                  startTime: '2023-01-01T00:00:00.000Z',
                  error: {
                    snippet: 'Test failed on first attempt',
                    stack: 'Error stack trace',
                  },
                },
                {
                  retry: 1,
                  status: 'passed',
                  duration: 1000,
                  startTime: '2023-01-01T00:00:01.000Z',
                },
              ],
            },
          ],
        },
      ],
    }, 1);

    // Add a true failure (failed on final retry)
    await resultsParser.parseTestSuite({
      title: 'Failed Suite',
      specs: [
        {
          title: 'Failed Test',
          tests: [
            {
              projectName: 'chrome',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 1000,
                  startTime: '2023-01-01T00:00:00.000Z',
                  error: {
                    snippet: 'Test failed permanently',
                    stack: 'Error stack trace',
                  },
                },
              ],
            },
          ],
        },
      ],
    }, 0);

    const failures = await resultsParser.getFailures();

    // Should only include the true failure, not the flaky test
    expect(failures).toHaveLength(1);
    expect(failures[0].test).toBe('Failed Test [chrome]');
    expect(failures[0].suite).toBe('Failed Suite');
    expect(failures[0].failureReason).toContain('Test failed permanently');
  });

  test('getFailures includes test that failed on final retry', async ({}) => {
    const resultsParser = new ResultsParser();

    // Add a test that failed on its final retry attempt using parseTestSuite
    await resultsParser.parseTestSuite({
      title: 'Retry Suite',
      specs: [
        {
          title: 'Eventually Failed Test',
          tests: [
            {
              projectName: 'chrome',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 1000,
                  startTime: '2023-01-01T00:00:00.000Z',
                  error: {
                    snippet: 'First failure',
                    stack: 'Error stack trace 1',
                  },
                },
                {
                  retry: 1,
                  status: 'failed',
                  duration: 1000,
                  startTime: '2023-01-01T00:00:01.000Z',
                  error: {
                    snippet: 'Final failure',
                    stack: 'Error stack trace 2',
                  },
                },
              ],
            },
          ],
        },
      ],
    }, 1);

    const failures = await resultsParser.getFailures();

    // Should include the test that failed on its final retry (retry 1, retries = 1)
    expect(failures).toHaveLength(1);
    expect(failures[0].test).toBe('Eventually Failed Test [chrome]');
    expect(failures[0].suite).toBe('Retry Suite');
    expect(failures[0].failureReason).toContain('Final failure');
  });

  test('getFailures correctly handles many flaky tests with single real failure', async ({}) => {
    const resultsParser = new ResultsParser();

    // Add multiple flaky tests (failed then passed)
    await resultsParser.parseTestSuite({
      title: 'Flaky Tests Suite',
      specs: [
        {
          title: 'Flaky Test 1',
          tests: [
            {
              projectName: 'chrome',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 1000,
                  startTime: '2023-01-01T00:00:00.000Z',
                  error: {
                    snippet: 'Flaky test 1 failed on first attempt',
                    stack: 'Error: Flaky failure 1',
                  },
                },
                {
                  retry: 1,
                  status: 'passed',
                  duration: 1200,
                  startTime: '2023-01-01T00:00:01.000Z',
                },
              ],
            },
          ],
        },
        {
          title: 'Flaky Test 2',
          tests: [
            {
              projectName: 'chrome',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 800,
                  startTime: '2023-01-01T00:00:02.000Z',
                  error: {
                    snippet: 'Flaky test 2 failed on first attempt',
                    stack: 'Error: Flaky failure 2',
                  },
                },
                {
                  retry: 1,
                  status: 'passed',
                  duration: 900,
                  startTime: '2023-01-01T00:00:03.000Z',
                },
              ],
            },
          ],
        },
        {
          title: 'Flaky Test 3',
          tests: [
            {
              projectName: 'firefox',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 1500,
                  startTime: '2023-01-01T00:00:04.000Z',
                  error: {
                    snippet: 'Flaky test 3 failed on first attempt',
                    stack: 'Error: Flaky failure 3',
                  },
                },
                {
                  retry: 1,
                  status: 'passed',
                  duration: 1100,
                  startTime: '2023-01-01T00:00:05.000Z',
                },
              ],
            },
          ],
        },
      ],
    }, 1);

    // Add one real failure that failed on its final retry
    await resultsParser.parseTestSuite({
      title: 'Real Failure Suite',
      specs: [
        {
          title: 'Permanently Failed Test',
          tests: [
            {
              projectName: 'safari',
              location: {
                file: '/home/ry/_repo/playwright-slack-report/tests/t1.spec.ts',
                line: 9,
                column: 1,
              },
              results: [
                {
                  retry: 0,
                  status: 'failed',
                  duration: 2000,
                  startTime: '2023-01-01T00:00:06.000Z',
                  error: {
                    snippet: 'This test always fails permanently',
                    stack: 'Error: Permanent failure\n    at test.js:15:10',
                  },
                },
              ],
            },
          ],
        },
      ],
    }, 0);

    const failures = await resultsParser.getFailures();

    // Should only include the single real failure, not any of the flaky tests
    expect(failures).toHaveLength(1);
    expect(failures[0].test).toBe('Permanently Failed Test [safari]');
    expect(failures[0].suite).toBe('Real Failure Suite');
    expect(failures[0].failureReason).toContain('This test always fails permanently');

    // Verify none of the flaky tests are included
    const flakyTest1 = failures.find((f) => f.test.includes('Flaky Test 1'));
    const flakyTest2 = failures.find((f) => f.test.includes('Flaky Test 2'));
    const flakyTest3 = failures.find((f) => f.test.includes('Flaky Test 3'));

    expect(flakyTest1).toBeUndefined();
    expect(flakyTest2).toBeUndefined();
    expect(flakyTest3).toBeUndefined();
  });
});
