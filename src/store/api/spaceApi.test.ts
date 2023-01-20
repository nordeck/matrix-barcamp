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
import {
  mockInitializeLinkableRoom,
  mockInitializeSpaceParent,
  mockLinkedRoom,
  mockParticipantPowerLevelsEvent,
  mockPowerLevelsEvent,
  mockRoomCreate,
  mockRoomMember,
  mockRoomName,
  mockSessionGrid,
} from '../../lib/testUtils';
import { createStore } from '../store';
import { spaceApi } from './spaceApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getSpaceRoom', () => {
  it('should return space room', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
    ).resolves.toEqual({ spaceId: '!room-id' });
  });

  it.skip('should handle missing space room and recover from it', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
    ).rejects.toEqual({
      name: 'LoadFailed',
      message: 'Could not determine space room',
    });

    mockInitializeSpaceParent(widgetApi);

    await waitFor(() =>
      expect(
        store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
      ).resolves.toEqual({ spaceId: '!space-id' })
    );
  });

  it.skip('should handle changed space room', async () => {
    const store = createStore({ widgetApi });

    const { reset } = mockInitializeSpaceParent(widgetApi);

    await expect(
      store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
    ).resolves.toEqual({ spaceId: '!space-id' });

    reset();
    mockInitializeSpaceParent(widgetApi, {
      spaceRoomId: '!another-space',
    });

    await waitFor(() =>
      expect(
        store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
      ).resolves.toEqual({ spaceId: '!another-space' })
    );
  });

  it.skip('should handle late create event update', async () => {
    const { createEvent } = mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
    ).resolves.toEqual({ spaceId: '!space-id' });

    delete createEvent.content.type;
    widgetApi.mockSendStateEvent(createEvent);

    await waitFor(() =>
      expect(
        store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
      ).rejects.toEqual({
        name: 'LoadFailed',
        message: 'Could not determine space room',
      })
    );
  });

  it.skip('should handle late state parent event update', async () => {
    const { parentEvent } = mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
    ).resolves.toEqual({ spaceId: '!space-id' });

    delete parentEvent.content.via;
    widgetApi.mockSendStateEvent(parentEvent);

    await waitFor(() =>
      expect(
        store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
      ).rejects.toEqual({
        name: 'LoadFailed',
        message: 'Could not determine space room',
      })
    );
  });

  it.skip('should handle late state child event update', async () => {
    const { childEvent } = mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
    ).resolves.toEqual({ spaceId: '!space-id' });

    delete childEvent.content.via;
    widgetApi.mockSendStateEvent(childEvent);

    await waitFor(() =>
      expect(
        store.dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
      ).rejects.toEqual({
        name: 'LoadFailed',
        message: 'Could not determine space room',
      })
    );
  });
});

describe('getLobbyRoom', () => {
  it('should return lobby room', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(mockSessionGrid());

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getLobbyRoom.initiate()).unwrap()
    ).resolves.toEqual({ roomId: '!room-id' });
  });

  it.skip('should return lobby room from within session room', async () => {
    mockInitializeSpaceParent(widgetApi, {});
    mockInitializeSpaceParent(widgetApi, { room_id: 'lobby-room-id' });
    widgetApi.mockSendStateEvent(
      mockLinkedRoom({
        state_key: '!room-id',
        content: { sessionGridId: 'lobby-room-id' },
      })
    );
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        state_key: 'lobby-room-id',
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getLobbyRoom.initiate()).unwrap()
    ).resolves.toEqual({ roomId: 'lobby-room-id' });
  });

  it.skip('should handle missing lobby room if not in a space', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getLobbyRoom.initiate()).unwrap()
    ).rejects.toEqual({
      name: 'LoadFailed',
      message: expect.stringMatching(/could not determine lobby room/i),
    });
  });

  it('should handle missing lobby room if no session grid exists', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getLobbyRoom.initiate()).unwrap()
    ).rejects.toEqual({
      name: 'NoLobby',
      message: 'Could not determine lobby room',
    });
  });

  it('should observe lobby room', async () => {
    const store = createStore({ widgetApi });

    const subscription = store.dispatch(
      spaceApi.endpoints.getLobbyRoom.initiate()
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getLobbyRoom.select()(store.getState())
      ).toMatchObject({
        error: {
          name: 'NoLobby',
          message: expect.stringMatching(/could not determine lobby room/i),
        },
      })
    );

    widgetApi.mockSendStateEvent(mockSessionGrid());
    mockInitializeSpaceParent(widgetApi);

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getLobbyRoom.select()(store.getState())
      ).toMatchObject({ data: { roomId: '!room-id' } })
    );

    subscription.unsubscribe();
  });

  it('should observe session grid event', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    const subscription = store.dispatch(
      spaceApi.endpoints.getLobbyRoom.initiate()
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getLobbyRoom.select()(store.getState())
      ).toMatchObject({
        error: {
          name: 'NoLobby',
          message: expect.stringMatching('Could not determine lobby room'),
        },
      })
    );

    widgetApi.mockSendStateEvent(mockSessionGrid());

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getLobbyRoom.select()(store.getState())
      ).toMatchObject({ data: { roomId: '!room-id' } })
    );

    subscription.unsubscribe();
  });
});

describe.skip('getUnassignedRooms', () => {
  it('should return rooms', async () => {
    // the own room is the lobby
    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(mockSessionGrid());

    // a proper room
    mockInitializeLinkableRoom(widgetApi, {
      room_id: 'room-valid',
      name: 'Room valid',
    });

    // a room with invalid type
    mockInitializeLinkableRoom(widgetApi, {
      room_id: 'room-invalid-type',
      name: 'Room invalid-type',
    });
    widgetApi.mockSendStateEvent(
      mockRoomCreate({
        room_id: 'room-invalid-type',
        content: { type: 'm.space' },
      })
    );

    // a room that is already linked
    mockInitializeLinkableRoom(widgetApi, {
      room_id: 'room-already-linked',
      name: 'Room already-linked',
    });
    widgetApi.mockSendStateEvent(
      mockLinkedRoom({ state_key: 'room-already-linked' })
    );

    // a room that is a lobby
    mockInitializeLinkableRoom(widgetApi, {
      room_id: 'room-already-lobby',
      name: 'Room already-lobby',
    });
    widgetApi.mockSendStateEvent(
      mockSessionGrid({ state_key: 'room-already-lobby' })
    );

    // a room without power
    mockInitializeLinkableRoom(widgetApi, {
      room_id: 'room-missing-power',
      name: 'Room missing-power',
    });
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: 'room-missing-power' })
    );

    // a room that was not joined
    mockInitializeLinkableRoom(widgetApi, {
      room_id: 'room-no-join',
      name: 'Room no-join',
    });
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: 'room-no-join',
        state_key: '@user-id',
        content: { membership: 'leave' },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(spaceApi.endpoints.getUnassignedRooms.initiate()).unwrap()
    ).resolves.toEqual([{ roomId: 'room-valid', roomName: 'Room valid' }]);
  });

  it('should observe rooms that becomes a lobby room', async () => {
    const store = createStore({ widgetApi });

    const subscription = store.dispatch(
      spaceApi.endpoints.getUnassignedRooms.initiate()
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState())
      ).toMatchObject({
        error: {
          name: 'LoadFailed',
          message: expect.stringMatching(/could not determine space room/i),
        },
      })
    );

    // put into a space
    mockInitializeSpaceParent(widgetApi);

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([])
    );

    // setup the room
    mockInitializeLinkableRoom(widgetApi, { room_id: '!room-id' });

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([{ roomId: '!room-id', roomName: 'Room' }])
    );

    // change the name
    widgetApi.mockSendStateEvent(
      mockRoomName({ room_id: '!room-id', content: { name: 'My Room' } })
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([{ roomId: '!room-id', roomName: 'My Room' }])
    );

    // change the type
    widgetApi.mockSendStateEvent(
      mockRoomCreate({ room_id: '!room-id', content: { type: 'm.space' } })
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([])
    );

    // reset the type
    widgetApi.mockSendStateEvent(mockRoomCreate({ room_id: '!room-id' }));

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([{ roomId: '!room-id', roomName: 'My Room' }])
    );

    // pull the power levels
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: '!room-id' })
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([])
    );

    // reset the power
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent({ room_id: '!room-id' }));

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([{ roomId: '!room-id', roomName: 'My Room' }])
    );

    // remove from room
    widgetApi.mockSendStateEvent(
      mockRoomMember({
        room_id: '!room-id',
        state_key: '@user-id',
        content: { membership: 'leave' },
      })
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([])
    );

    // add back to room
    widgetApi.mockSendStateEvent(
      mockRoomMember({ room_id: '!room-id', state_key: '@user-id' })
    );

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([{ roomId: '!room-id', roomName: 'My Room' }])
    );
    // convert to a lobby room
    widgetApi.mockSendStateEvent(mockSessionGrid({ state_key: '!room-id' }));

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([])
    );

    subscription.unsubscribe();
  });

  it('should observe rooms that becomes a linked room', async () => {
    mockInitializeSpaceParent(widgetApi);
    mockInitializeLinkableRoom(widgetApi, { room_id: '!room-id' });

    const store = createStore({ widgetApi });

    const subscription = store.dispatch(
      spaceApi.endpoints.getUnassignedRooms.initiate()
    );

    await waitFor(
      () =>
        expect(
          spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
        ).toEqual([{ roomId: '!room-id', roomName: 'Room' }]),
      { timeout: 10000 }
    );

    widgetApi.mockSendStateEvent(mockLinkedRoom({ state_key: '!room-id' }));

    await waitFor(() =>
      expect(
        spaceApi.endpoints.getUnassignedRooms.select()(store.getState()).data
      ).toEqual([])
    );

    subscription.unsubscribe();
  });
});

describe('markRoomAsSuggested', () => {
  it('should mark room as suggested', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(
        spaceApi.endpoints.markRoomAsSuggested.initiate({
          spaceId: '!space-id',
          roomId: '!room-id',
        })
      )
    ).resolves.toEqual({
      data: expect.objectContaining({
        content: {
          via: ['matrix.to'],
          order: ' lobby',
          suggested: true,
        },
        state_key: '!room-id',
        room_id: '!space-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.space.child',
      {
        via: ['matrix.to'],
        order: ' lobby',
        suggested: true,
      },
      { stateKey: '!room-id', roomId: '!space-id' }
    );
  });

  it('should be idempotent', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await store
      .dispatch(
        spaceApi.endpoints.markRoomAsSuggested.initiate({
          spaceId: '!space-id',
          roomId: '!room-id',
        })
      )
      .unwrap();
    await store
      .dispatch(
        spaceApi.endpoints.markRoomAsSuggested.initiate({
          spaceId: '!space-id',
          roomId: '!room-id',
        })
      )
      .unwrap();
  });
});
