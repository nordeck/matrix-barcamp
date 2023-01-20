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
import { mockRoomHistoryVisibility } from '../../lib/testUtils';
import { createStore } from '../store';
import { roomHistoryVisibilityApi } from './roomHistoryVisibilityApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('patchRoomHistoryVisibility', () => {
  it('should change the history_visibility of the room', async () => {
    widgetApi.mockSendStateEvent(mockRoomHistoryVisibility());

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomHistoryVisibilityApi.endpoints.patchRoomHistoryVisibility.initiate(
            {
              roomId: '!room-id',
              changes: { history_visibility: 'shared' },
            }
          )
        )
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: { history_visibility: 'shared' },
        state_key: '',
        room_id: '!room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.history_visibility',
      { history_visibility: 'shared' }
    );
  });

  it('should update a missing history_visibility', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomHistoryVisibilityApi.endpoints.patchRoomHistoryVisibility.initiate(
            {
              roomId: '!room-id',
              changes: { history_visibility: 'shared' },
            }
          )
        )
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: { history_visibility: 'shared' },
        state_key: '',
        room_id: '!room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.history_visibility',
      { history_visibility: 'shared' }
    );
  });

  it('should be idempotent', async () => {
    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomHistoryVisibilityApi.endpoints.patchRoomHistoryVisibility.initiate({
          roomId: '!room-id',
          changes: { history_visibility: 'shared' },
        })
      )
      .unwrap();
    await store
      .dispatch(
        roomHistoryVisibilityApi.endpoints.patchRoomHistoryVisibility.initiate({
          roomId: '!room-id',
          changes: { history_visibility: 'shared' },
        })
      )
      .unwrap();
  });
});
