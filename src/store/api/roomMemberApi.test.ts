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
import { mockInitializeSpaceParent, mockRoomMember } from '../../lib/testUtils';
import { createStore } from '../store';
import { roomMemberApi } from './roomMemberApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getRoomMembers', () => {
  it('should return room members', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(mockRoomMember());
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'alice',
        content: {
          displayname: 'Alice',
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(roomMemberApi.endpoints.getRoomMembers.initiate()).unwrap()
    ).resolves.toEqual({
      ids: ['@user-id', 'alice'],
      entities: {
        '@user-id': expect.objectContaining({
          state_key: '@user-id',
          content: {
            membership: 'join',
            displayname: 'User',
          },
        }),
        alice: expect.objectContaining({
          state_key: 'alice',
          content: {
            membership: 'join',
            displayname: 'Alice',
          },
        }),
      },
    });
  });

  it('should observe room members', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(mockRoomMember());

    const store = createStore({ widgetApi });

    store.dispatch(roomMemberApi.endpoints.getRoomMembers.initiate());

    await waitFor(() =>
      expect(
        roomMemberApi.endpoints.getRoomMembers.select()(store.getState()).data
      ).toEqual(expect.objectContaining({ ids: ['@user-id'] }))
    );

    widgetApi.mockSendStateEvent(
      mockRoomMember({
        state_key: 'alice',
        content: {
          displayname: 'Alice',
        },
      })
    );

    await waitFor(() =>
      expect(
        roomMemberApi.endpoints.getRoomMembers.select()(store.getState()).data
      ).toEqual(expect.objectContaining({ ids: ['@user-id', 'alice'] }))
    );
  });

  it('should observe room members when space changes', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(roomMemberApi.endpoints.getRoomMembers.initiate());

    widgetApi.mockSendStateEvent(mockRoomMember());

    await waitFor(() =>
      expect(
        roomMemberApi.endpoints.getRoomMembers.select()(store.getState()).error
      ).toEqual({
        name: 'LoadFailed',
        message: expect.stringMatching(/Could not load room members/),
      })
    );

    mockInitializeSpaceParent(widgetApi);

    await waitFor(() =>
      expect(
        roomMemberApi.endpoints.getRoomMembers.select()(store.getState()).data
      ).toEqual(expect.objectContaining({ ids: ['@user-id'] }))
    );
  });
});
