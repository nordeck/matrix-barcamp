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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { waitFor } from '@testing-library/react';
import { mockInitializeSpaceParent, mockLinkedRoom } from '../../lib/testUtils';
import { createStore } from '../store';
import {
  linkedRoomApi,
  linkedRoomsEntityAdapter,
  selectLinkedRoomForTopic,
} from './linkedRoomApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe.skip('getLinkedRooms', () => {
  it('should return linked rooms', async () => {
    mockInitializeSpaceParent(widgetApi);

    const linkedRoom0 = widgetApi.mockSendStateEvent(mockLinkedRoom());
    const linkedRoom1 = widgetApi.mockSendStateEvent(
      mockLinkedRoom({
        state_key: '!another-room',
        content: { topicId: 'topic-1' },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(linkedRoomApi.endpoints.getLinkedRooms.initiate()).unwrap()
    ).resolves.toEqual({
      entities: {
        '!linked-room-id': linkedRoom0,
        '!another-room': linkedRoom1,
      },
      ids: ['!linked-room-id', '!another-room'],
    });
  });

  it('should observe topics', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    store.dispatch(linkedRoomApi.endpoints.getLinkedRooms.initiate());

    await waitFor(() =>
      expect(
        linkedRoomApi.endpoints.getLinkedRooms.select()(store.getState()).data
      ).toMatchObject({ entities: {}, ids: [] })
    );

    const linkedRoom = widgetApi.mockSendStateEvent(mockLinkedRoom());

    await waitFor(() =>
      expect(
        linkedRoomApi.endpoints.getLinkedRooms.select()(store.getState()).data
      ).toMatchObject({
        entities: {
          '!linked-room-id': linkedRoom,
        },
        ids: ['!linked-room-id'],
      })
    );
  });

  it('should observe space room changes', async () => {
    const linkedRoom0 = widgetApi.mockSendStateEvent(mockLinkedRoom());
    const linkedRoom1 = widgetApi.mockSendStateEvent(
      mockLinkedRoom({
        state_key: '!another-room',
        room_id: '!another-space',
        content: { topicId: 'topic-1' },
      })
    );

    const store = createStore({ widgetApi });

    store.dispatch(linkedRoomApi.endpoints.getLinkedRooms.initiate());

    // Start without space
    await waitFor(() =>
      expect(
        linkedRoomApi.endpoints.getLinkedRooms.select()(store.getState()).error
      ).toEqual({
        name: 'LoadFailed',
        message: expect.stringMatching(/could not load linked rooms/i),
      })
    );

    // Start in one room
    mockInitializeSpaceParent(widgetApi);
    await waitFor(() =>
      expect(
        linkedRoomApi.endpoints.getLinkedRooms.select()(store.getState()).data
      ).toEqual({
        entities: {
          [linkedRoom0.state_key]: linkedRoom0,
        },
        ids: [linkedRoom0.state_key],
      })
    );

    // Another canonical space is found
    mockInitializeSpaceParent(widgetApi, {
      spaceRoomId: '!another-space',
    });
    await waitFor(() =>
      expect(
        linkedRoomApi.endpoints.getLinkedRooms.select()(store.getState()).data
      ).toEqual({
        entities: {
          [linkedRoom1.state_key]: linkedRoom1,
        },
        ids: [linkedRoom1.state_key],
      })
    );
  });
});

describe('selectLinkedRoomForTopic', () => {
  it('should select the linked room event', () => {
    expect(
      selectLinkedRoomForTopic(
        linkedRoomsEntityAdapter.upsertMany(
          linkedRoomsEntityAdapter.getInitialState(),
          [
            mockLinkedRoom({
              state_key: '!room-1',
              content: {
                topicId: 'topic-1',
              },
            }),
            mockLinkedRoom({
              state_key: '!room-2',
              content: {
                topicId: 'topic-2',
              },
            }),
          ]
        ),
        'topic-1'
      )
    ).toEqual(
      mockLinkedRoom({
        state_key: '!room-1',
        content: {
          topicId: 'topic-1',
        },
      })
    );
  });

  it('should select linked room event with the lowest origin_server_ts', () => {
    expect(
      selectLinkedRoomForTopic(
        linkedRoomsEntityAdapter.upsertMany(
          linkedRoomsEntityAdapter.getInitialState(),
          [
            mockLinkedRoom({
              state_key: '!room-1',
              origin_server_ts: 2000,
              content: {
                topicId: 'topic-1',
              },
            }),
            mockLinkedRoom({
              state_key: '!room-2',
              origin_server_ts: 1000,
              content: {
                topicId: 'topic-1',
              },
            }),
          ]
        ),
        'topic-1'
      )
    ).toEqual(
      mockLinkedRoom({
        state_key: '!room-2',
        origin_server_ts: 1000,
        content: {
          topicId: 'topic-1',
        },
      })
    );
  });

  it('should ignore linked room event from another session grid', () => {
    expect(
      selectLinkedRoomForTopic(
        linkedRoomsEntityAdapter.upsertMany(
          linkedRoomsEntityAdapter.getInitialState(),
          [
            mockLinkedRoom({
              state_key: '!room-1',
              content: {
                topicId: 'topic-1',
                sessionGridId: '!another-room',
              },
            }),
          ]
        ),
        'topic-1',
        '!room-id'
      )
    ).toBeUndefined();
  });

  it('should handle missing linked room event', () => {
    expect(
      selectLinkedRoomForTopic(
        linkedRoomsEntityAdapter.getInitialState(),
        'topic-1'
      )
    ).toBeUndefined();
  });
});
