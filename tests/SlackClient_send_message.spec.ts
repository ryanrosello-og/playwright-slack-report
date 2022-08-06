import SlackClient from '../src/SlackClient';
import { mock, instance, when, verify } from 'ts-mockito';
import { ChatPostMessageResponse } from '@slack/web-api';
import {test} from './fixtures'

test.describe("SlackClient.sendMessage()", () => {
  test('SlackClient.sendMessage() ', async ({  }) => {
    let mockedClient: SlackClient = mock(SlackClient);
    let response: ChatPostMessageResponse = { ok: true }
    when(mockedClient.doPostRequest(
      'hc',
      [],
    )).thenResolve(response);
    let client = instance(mockedClient);

    await client.doPostRequest('hc', []);
    let r =mockedClient.doPostRequest('hc', [])
    verify(await mockedClient.doPostRequest('hc', [])).once();    
  })
})


