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
import { waitFor } from '@testing-library/react';
import { mockInitializeLinkableRoom, mockRoomName } from '../../lib/testUtils';
import { createStore } from '../store';
import { roomNamesApi } from './roomNamesApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getRoomName', () => {
  it('should return room name', async () => {
    const event = widgetApi.mockSendStateEvent(mockRoomName());

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomNamesApi.endpoints.getRoomName.initiate({
            roomId: '!linked-room-id',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event });
  });

  it('should handle missing room name', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomNamesApi.endpoints.getRoomName.initiate({
            roomId: '!linked-room-id',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: undefined });
  });

  it('should handle load errors', async () => {
    widgetApi.receiveStateEvents.mockRejectedValue(new Error('Some Error'));

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomNamesApi.endpoints.getRoomName.initiate({
            roomId: '!linked-room-id',
          })
        )
        .unwrap()
    ).rejects.toEqual({
      message: 'Could not load the room name: Some Error',
      name: 'LoadFailed',
    });
  });

  it('should observe room name', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(
      roomNamesApi.endpoints.getRoomName.initiate({ roomId: '!linked-room-id' })
    );

    await waitFor(() =>
      expect(
        roomNamesApi.endpoints.getRoomName.select({
          roomId: '!linked-room-id',
        })(store.getState()).data
      ).toEqual({ event: undefined })
    );

    const event = widgetApi.mockSendStateEvent(mockRoomName());

    await waitFor(() =>
      expect(
        roomNamesApi.endpoints.getRoomName.select({
          roomId: '!linked-room-id',
        })(store.getState()).data
      ).toEqual({ event })
    );
  });
});

describe('patchRoomName', () => {
  it('should change the name of the room', async () => {
    mockInitializeLinkableRoom(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomNamesApi.endpoints.patchRoomName.initiate({
            roomId: '!unassigned-room-id',
            changes: { name: 'New Name' },
          })
        )
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: { name: 'New Name' },
        state_key: '',
        room_id: '!unassigned-room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.name',
      { name: 'New Name' },
      { roomId: '!unassigned-room-id' }
    );
  });

  it('should reject updating a missing room name', async () => {
    const { roomNameEvent } = mockInitializeLinkableRoom(widgetApi);

    // invalidate the room name event
    delete (roomNameEvent as StateEvent<unknown>).content;
    widgetApi.mockSendStateEvent(roomNameEvent);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomNamesApi.endpoints.patchRoomName.initiate({
            roomId: '!unassigned-room-id',
            changes: { name: 'New Name' },
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'No m.room.name event found',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should be idempotent', async () => {
    mockInitializeLinkableRoom(widgetApi);

    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomNamesApi.endpoints.patchRoomName.initiate({
          roomId: '!unassigned-room-id',
          changes: {},
        })
      )
      .unwrap();
    await store
      .dispatch(
        roomNamesApi.endpoints.patchRoomName.initiate({
          roomId: '!unassigned-room-id',
          changes: {},
        })
      )
      .unwrap();
  });
});
