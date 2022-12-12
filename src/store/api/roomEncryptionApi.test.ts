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
import { mockRoomEncryption } from '../../lib/testUtils';
import { createStore } from '../store';
import { roomEncryptionApi } from './roomEncryptionApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('hasRoomEncryption', () => {
  it('should return room encryption state from current room', async () => {
    widgetApi.mockSendStateEvent(mockRoomEncryption());

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(roomEncryptionApi.endpoints.hasRoomEncryption.initiate({}))
        .unwrap()
    ).resolves.toEqual(true);
  });

  it('should return room encryption state', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomEncryption({ room_id: '!linked-room-id' })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomEncryptionApi.endpoints.hasRoomEncryption.initiate({
            roomId: '!linked-room-id',
          })
        )
        .unwrap()
    ).resolves.toEqual(true);
  });

  it('should handle missing room encryption', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          roomEncryptionApi.endpoints.hasRoomEncryption.initiate({
            roomId: '!linked-room-id',
          })
        )
        .unwrap()
    ).resolves.toEqual(false);
  });
});
