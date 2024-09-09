"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateCustomLayout = (summaryResults) => {
    const maxNumberOfFailures = 10;
    const maxNumberOfFailureLength = 650;
    const fails = [];
    const meta = [];
    for (let i = 0; i < summaryResults.failures.length; i += 1) {
        const { failureReason, test } = summaryResults.failures[i];
        const formattedFailure = failureReason
            .substring(0, maxNumberOfFailureLength)
            .split('\n')
            .map((l) => `>${l}`)
            .join('\n');
        fails.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${test}*
        \n\n${formattedFailure}`,
            },
        });
        if (i > maxNumberOfFailures) {
            fails.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '*⚠️ There are too many failures to display, view the full results in BuildKite*',
                },
            });
            break;
        }
    }
    if (summaryResults.meta) {
        for (let i = 0; i < summaryResults.meta.length; i += 1) {
            const { key, value } = summaryResults.meta[i];
            meta.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `\n*${key}* :\t${value}`,
                },
            });
        }
    }
    const testWithStringAttachment = summaryResults.tests.filter((t) => t.attachments)[0];
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '**Thisi is cusomter block**',
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `**The first test is:**\n${summaryResults.tests[0].name}`,
            },
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `**Test with attachment:**\n${testWithStringAttachment?.attachments
                    ?.filter((a) => a.contentType === 'text/plain')
                    .map((a) => a.body?.toString())}`,
            },
        },
        ...meta,
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `:white_check_mark: *${summaryResults.passed}* Tests ran successfully \n\n :red_circle: *${summaryResults.failed}* Tests failed \n\n ${summaryResults.skipped > 0
                    ? `:fast_forward: *${summaryResults.skipped}* skipped`
                    : ''} \n\n `,
            },
        },
        {
            type: 'divider',
        },
        ...fails,
    ];
};
exports.default = generateCustomLayout;
//# sourceMappingURL=my_block.js.map