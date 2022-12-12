/*
 * Copyright 2022 Nordeck IT + Consulting GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { StateEvent } from '@matrix-widget-toolkit/api';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { mockInitializeLinkableRoom } from '../../lib/testUtils';
import { createStore } from '../store';
import { roomTopicsApi } from './roomTopicsApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('patchRoomName', () => {
  it('should change the topic of a room', async () => {
    mockInitializeLinkableRoom(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomTopicsApi.endpoints.patchRoomTopic.initiate({
            roomId: '!unassigned-room-id',
            changes: { topic: 'New Topic' },
          })
        )
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: { topic: 'New Topic' },
        state_key: '',
        room_id: '!unassigned-room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.topic',
      { topic: 'New Topic' },
      { roomId: '!unassigned-room-id' }
    );
  });

  it('should update a missing room topic', async () => {
    const { roomTopicEvent } = mockInitializeLinkableRoom(widgetApi);

    // invalidate the room topic event
    delete (roomTopicEvent as StateEvent<unknown>).content;
    widgetApi.mockSendStateEvent(roomTopicEvent);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomTopicsApi.endpoints.patchRoomTopic.initiate({
            roomId: '!unassigned-room-id',
            changes: { topic: 'New Topic' },
          })
        )
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: { topic: 'New Topic' },
        state_key: '',
        room_id: '!unassigned-room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
  });

  it('should be idempotent', async () => {
    mockInitializeLinkableRoom(widgetApi);

    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomTopicsApi.endpoints.patchRoomTopic.initiate({
          roomId: '!unassigned-room-id',
          changes: { topic: 'topic' },
        })
      )
      .unwrap();
    await store
      .dispatch(
        roomTopicsApi.endpoints.patchRoomTopic.initiate({
          roomId: '!unassigned-room-id',
          changes: { topic: 'topic' },
        })
      )
      .unwrap();
  });
});
