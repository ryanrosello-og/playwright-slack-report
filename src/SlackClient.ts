/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
import {
  WebClient,
  KnownBlock,
  Block,
  ChatPostMessageResponse,
  LogLevel,
} from '@slack/web-api';
import { SummaryResults } from '.';
import {
  generateBlocks,
  generateFailures,
  generateFallbackText,
} from './LayoutGenerator';

export type additionalInfo = Array<{ key: string; value: string }>;

export default class SlackClient {
  private slackWebClient: WebClient;

  private static readonly MAX_BLOCKS_PER_MESSAGE = 50;

  constructor(slackClient: WebClient) {
    this.slackWebClient = slackClient;
  }

  private static chunkBlocks(
    blocks: (Block | KnownBlock)[],
    chunkSize: number = SlackClient.MAX_BLOCKS_PER_MESSAGE,
  ): (Block | KnownBlock)[][] {
    const chunks: (Block | KnownBlock)[][] = [];
    for (let i = 0; i < blocks.length; i += chunkSize) {
      chunks.push(blocks.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async sendMessage({
    options,
  }: {
    options: {
      channelIds: Array<string>;
      customLayout: Function | undefined;
      customLayoutAsync: Function | undefined;
      fakeRequest?: Function;
      maxNumberOfFailures: number;
      slackOAuthToken?: string;
      slackLogLevel?: LogLevel;
      disableUnfurl?: boolean;
      summaryResults: SummaryResults;
      showInThread: boolean;
      sendCustomBlocksInThreadAfterIndex?: number;
    };
  }): Promise<Array<{ channel: string; outcome: string; ts: string }>> {
    let blocks: (Block | KnownBlock)[];
    let threadedBlocks: (Block | KnownBlock)[] = [];
    if (options.customLayout) {
      const allBlocks = options.customLayout(options.summaryResults);
      if (options.sendCustomBlocksInThreadAfterIndex) {
        blocks = allBlocks.slice(0, options.sendCustomBlocksInThreadAfterIndex);
        threadedBlocks = allBlocks.slice(
          options.sendCustomBlocksInThreadAfterIndex,
          allBlocks.length,
        );
      } else {
        blocks = allBlocks;
      }
    } else if (options.customLayoutAsync) {
      const allBlocks = await options.customLayoutAsync(options.summaryResults);
      if (options.sendCustomBlocksInThreadAfterIndex) {
        blocks = allBlocks.slice(0, options.sendCustomBlocksInThreadAfterIndex);
        threadedBlocks = allBlocks.slice(
          options.sendCustomBlocksInThreadAfterIndex,
          allBlocks.length,
        );
      } else {
        blocks = allBlocks;
      }
    } else if (options.showInThread) {
      const modifiedOptions = {
        ...options,
        summaryResults: { ...options.summaryResults, failures: [] },
      };
      blocks = await generateBlocks(
        modifiedOptions.summaryResults,
        options.maxNumberOfFailures,
      );
    } else {
      blocks = await generateBlocks(
        options.summaryResults,
        options.maxNumberOfFailures,
      );
    }
    if (!options.channelIds) {
      throw new Error(`Channel ids [${options.channelIds}] is not valid`);
    }
    const fallbackText = generateFallbackText(options.summaryResults);
    const result = [];
    const unfurl: boolean = !options.disableUnfurl;
    for (const channel of options.channelIds) {
      let chatResponse: ChatPostMessageResponse;
      try {
        // under test
        if (options.fakeRequest) {
          chatResponse = await options.fakeRequest();
        } else {
          // send request for reals
          chatResponse = await SlackClient.doPostRequest(
            this.slackWebClient,
            channel,
            fallbackText,
            blocks,
            unfurl,
          );
        }
        if (chatResponse.ok) {
          result.push({
            channel,
            outcome: `✅ Message sent to ${channel}`,
            ts: chatResponse.ts,
          });
          // eslint-disable-next-line no-console
          console.log(`✅ Message sent to ${channel}`);
        } else {
          result.push({
            channel,
            outcome: `❌ Message not sent to ${channel} \r\n ${JSON.stringify(
              chatResponse,
              null,
              2,
            )}`,
          });
        }
      } catch (error: any) {
        result.push({
          channel,
          outcome: `❌ Message not sent to ${channel} \r\n ${error.message}`,
        });
      }
    }

    if (threadedBlocks.length > 0) {
      const threadedBlockChunks = SlackClient.chunkBlocks(threadedBlocks);
      for (let i = 0; i < result.length; i += 1) {
        const threadTs = result[i].ts;
        try {
          for (const chunk of threadedBlockChunks) {
            if (options.fakeRequest) {
              await options.fakeRequest();
            } else {
              await SlackClient.doPostRequest(
                this.slackWebClient,
                result[i].channel,
                fallbackText,
                chunk,
                unfurl,
                threadTs,
              );
            }
          }
          // eslint-disable-next-line no-console
          console.log(
            `✅ Threaded messages sent to ${result[i].channel} (${threadedBlockChunks.length} message${threadedBlockChunks.length > 1 ? 's' : ''})`,
          );
        } catch (error: any) {
          // eslint-disable-next-line no-console
          console.error(
            `❌ Failed to send threaded message to ${result[i].channel}: ${error.message}`,
          );
        }
      }
    }
    return result;
  }

  async attachDetailsToThread({
    channelIds,
    ts,
    summaryResults,
    maxNumberOfFailures,
    disableUnfurl,
    fakeRequest,
  }: {
    channelIds: Array<string>;
    ts: string;
    summaryResults: SummaryResults;
    maxNumberOfFailures: number;
    disableUnfurl?: boolean;
    fakeRequest?: Function;
  }) {
    const result = [];
    const blocks = await generateFailures(summaryResults, maxNumberOfFailures);
    if (blocks.length === 0) {
      return result;
    }

    const fallbackText = generateFallbackText(summaryResults);
    const blockChunks = SlackClient.chunkBlocks(blocks);

    for (const channel of channelIds) {
      try {
        for (const chunk of blockChunks) {
          // under test
          let chatResponse: ChatPostMessageResponse;
          if (fakeRequest) {
            chatResponse = await fakeRequest();
          } else {
            chatResponse = await SlackClient.doPostRequest(
              this.slackWebClient,
              channel,
              fallbackText,
              chunk,
              disableUnfurl,
              ts,
            );
          }
          if (chatResponse.ok) {
            // eslint-disable-next-line no-console
            console.log(`✅ Message sent to ${channel} within thread ${ts}`);
            result.push({
              channel,
              outcome: `✅ Message sent to ${channel} within thread ${ts}`,
              ts: chatResponse.ts,
            });
          }
        }
        // eslint-disable-next-line no-console
        console.log(
          `✅ All failure details sent to ${channel} within thread ${ts} (${blockChunks.length} message${blockChunks.length > 1 ? 's' : ''})`,
        );
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(
          `❌ Failed to send failure details to ${channel} within thread ${ts}: ${error.message}`,
        );
        result.push({
          channel,
          outcome: `❌ Failed to send failure details to ${channel} within thread ${ts}: ${error.message}`,
        });
      }
    }
    return result;
  }

  static async doPostRequest(
    slackWebClient: WebClient,
    channel: string,
    fallbackText: string,
    blocks: Array<KnownBlock | Block>,
    unfurl: boolean,
    threadTimestamp?: string,
  ): Promise<ChatPostMessageResponse> {
    const chatResponse = await slackWebClient.chat.postMessage({
      channel,
      text: fallbackText,
      unfurl_links: unfurl,
      blocks,
      thread_ts: threadTimestamp,
    });
    return chatResponse;
  }
}
