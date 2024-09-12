function generateCustomLayoutSimpleMeta(summaryResults) {
    const meta = [];
    if (summaryResults.meta) {
        for (let i = 0; i < summaryResults.meta.length; i += 1) {
            const { key, value } = summaryResults.meta[i];
            meta.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `\n*${key}* :🙌\t${value}`,
                },
            });
        }
    }
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: summaryResults.failed === 0
                    ? ':tada: All tests passed!'
                    : `😭${summaryResults.failed} failure(s) out of ${summaryResults.tests.length} tests`,
            },
        },
        ...meta,
    ];
}
async function generateCustomAsyncLayoutSimpleMeta(summaryResults) {
    const meta = [];
    if (summaryResults.meta) {
        for (let i = 0; i < summaryResults.meta.length; i += 1) {
            const { key, value } = summaryResults.meta[i];
            meta.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `\n*${key}* :😍\t${value}`,
                },
            });
        }
    }
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: summaryResults.failed === 0
                    ? ':tada: All tests passed!'
                    : `😭${summaryResults.failed} failure(s) out of ${summaryResults.tests.length} tests`,
            },
        },
        ...meta,
    ];
}
exports.generateCustomLayoutSimpleMeta = generateCustomLayoutSimpleMeta;
exports.generateCustomAsyncLayoutSimpleMeta
    = generateCustomAsyncLayoutSimpleMeta;
//# sourceMappingURL=cli_block_with_meta.js.map