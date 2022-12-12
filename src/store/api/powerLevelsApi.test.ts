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
import { nanoid } from 'nanoid';
import { firstValueFrom, ReplaySubject } from 'rxjs';
import { mockPowerLevelsEvent } from '../../lib/testUtils';
import { createStore } from '../store';
import { powerLevelsApi } from './powerLevelsApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getPowerLevels', () => {
  it('should return no power levels if state event is missing', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(powerLevelsApi.endpoints.getPowerLevels.initiate({}))
        .unwrap()
    ).resolves.toEqual({ event: undefined });
  });

  it('should return power levels for current room', async () => {
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(powerLevelsApi.endpoints.getPowerLevels.initiate({}))
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: {
          users: { '@user-id': 100 },
        },
      }),
    });
  });

  it('should return power levels for specific room', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({ room_id: '!space-id' })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          powerLevelsApi.endpoints.getPowerLevels.initiate({
            roomId: '!space-id',
          })
        )
        .unwrap()
    ).resolves.toEqual({
      event: expect.objectContaining({
        content: {
          users: { '@user-id': 100 },
        },
      }),
    });
  });

  it('should observe power levels for current room', async () => {
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent());

    const store = createStore({ widgetApi });

    store.dispatch(powerLevelsApi.endpoints.getPowerLevels.initiate({}));

    await waitFor(() =>
      expect(
        powerLevelsApi.endpoints.getPowerLevels.select({})(store.getState())
          .data
      ).toEqual({
        event: expect.objectContaining({
          content: {
            users: { '@user-id': 100 },
          },
        }),
      })
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({ content: { users_default: 50 } })
    );

    await waitFor(() =>
      expect(
        powerLevelsApi.endpoints.getPowerLevels.select({})(store.getState())
          .data
      ).toEqual({
        event: expect.objectContaining({
          content: {
            users: { '@user-id': 100 },
            users_default: 50,
          },
        }),
      })
    );
  });

  it('should observe power levels for specific room', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({ room_id: '!space-id' })
    );

    const store = createStore({ widgetApi });

    store.dispatch(
      powerLevelsApi.endpoints.getPowerLevels.initiate({ roomId: '!space-id' })
    );

    await waitFor(() =>
      expect(
        powerLevelsApi.endpoints.getPowerLevels.select({ roomId: '!space-id' })(
          store.getState()
        ).data
      ).toEqual({
        event: expect.objectContaining({
          content: {
            users: { '@user-id': 100 },
          },
        }),
      })
    );

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 50 },
        room_id: '!space-id',
      })
    );

    await waitFor(() =>
      expect(
        powerLevelsApi.endpoints.getPowerLevels.select({ roomId: '!space-id' })(
          store.getState()
        ).data
      ).toEqual({
        event: expect.objectContaining({
          content: {
            users: { '@user-id': 100 },
            users_default: 50,
          },
        }),
      })
    );
  });
});

describe('patchPowerLevels', () => {
  it('should patch power levels event in current room', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 100 },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(
        powerLevelsApi.endpoints.patchPowerLevels.initiate({
          changes: { users_default: 0, events_default: 0 },
        })
      )
    ).resolves.toEqual({
      data: expect.objectContaining({
        content: {
          users: { '@user-id': 100 },
          users_default: 0,
          events_default: 0,
        },
        room_id: '!room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.power_levels',
      {
        users: { '@user-id': 100 },
        users_default: 0,
        events_default: 0,
      },
      { roomId: undefined }
    );
  });

  it('should patch power levels event in specific room', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 100 },
        room_id: '!space-id',
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(
        powerLevelsApi.endpoints.patchPowerLevels.initiate({
          roomId: '!space-id',
          changes: { users_default: 0, events_default: 0 },
        })
      )
    ).resolves.toEqual({
      data: expect.objectContaining({
        content: {
          users: { '@user-id': 100 },
          users_default: 0,
          events_default: 0,
        },
        room_id: '!space-id',
      }),
    });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.power_levels',
      {
        users: { '@user-id': 100 },
        users_default: 0,
        events_default: 0,
      },
      { roomId: '!space-id' }
    );
  });

  it('should perform optimistic update of power levels', async () => {
    const sendStateEventCompleter = new ReplaySubject<void>();

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 100 },
      })
    );
    widgetApi.sendStateEvent.mockImplementation(
      async (type, content, options) => {
        const ev = {
          type,
          content,
          state_key: options?.stateKey ?? '',
          event_id: nanoid(),
          origin_server_ts: Date.now(),
          sender: '@user-id',
          room_id: options?.roomId ?? '!room-id',
        };

        await firstValueFrom(sendStateEventCompleter);

        widgetApi.mockSendStateEvent(ev);

        return ev;
      }
    );

    const store = createStore({ widgetApi });

    await store
      .dispatch(powerLevelsApi.endpoints.getPowerLevels.initiate({}))
      .unwrap();

    const promise = store.dispatch(
      powerLevelsApi.endpoints.patchPowerLevels.initiate({
        changes: { users_default: 0, events_default: 0 },
      })
    );

    // Optimistic update is applied
    await waitFor(() =>
      expect(
        powerLevelsApi.endpoints.getPowerLevels.select({})(store.getState())
          .data
      ).toEqual({
        event: expect.objectContaining({
          content: {
            users: { '@user-id': 100 },
            users_default: 0,
            events_default: 0,
          },
        }),
      })
    );

    sendStateEventCompleter.next();

    await expect(promise).resolves.toEqual({
      data: expect.objectContaining({
        content: {
          users: { '@user-id': 100 },
          users_default: 0,
          events_default: 0,
        },
        room_id: '!room-id',
      }),
    });
  });

  it('should be idempotent', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: { users_default: 100 },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(
        powerLevelsApi.endpoints.patchPowerLevels.initiate({
          changes: { users_default: 100 },
        })
      )
    ).resolves.toEqual({
      data: expect.objectContaining({
        content: {
          users: { '@user-id': 100 },
          users_default: 100,
        },
        room_id: '!room-id',
      }),
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});
