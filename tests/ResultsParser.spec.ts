import { expect, test as base } from '@playwright/test';
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
  test('parses results successfully', async ({ testData }) => {
    const resultsParser = new ResultsParser();
    resultsParser.addTestResult(
      testData.suites[0].suites[0].title,
      testData.suites[0].suites[0].tests[0],
    );
    const results = await resultsParser.getParsedResults();
    expect(results).toEqual({
      passed: 0,
      failed: 1,
      skipped: 0,
      failures: [
        {
          test: 'basic test failure ',
          failureReason:
            'expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n \n Error: expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
        },
      ],
      tests: [
        {
          suiteName: 'tests/t1.spec.ts',
          name: 'basic test failure ',
          status: 'failed',
          retry: 0,
          startedAt: '2021-12-18T09:43:16.000Z',
          endedAt: '2021-12-18T09:43:39.591Z',
          reason:
            'expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n \n Error: expect(received).toHaveText(expected)\n\nExpected string: "Playwright Fail"\nReceived string: "Playwright"\nCall log:\n  - expect.toHaveText with timeout 1000ms\n  - waiting for selector ".navbar__inner .navbar__title"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n  -   selector resolved to <b class="navbar__title text--truncate">Playwright</b>\n  -   unexpected value "Playwright"\n\n    at /home/ry/_repo/playwright-slack-report/tests/t1.spec.ts:17:23',
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
});
