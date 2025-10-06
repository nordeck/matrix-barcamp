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
import { first, isEqual, isError, last, merge } from 'lodash';
import { filter } from 'rxjs';
import {
  isValidRoomNameEvent,
  RoomNameEvent,
  STATE_EVENT_ROOM_NAME,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

/**
 * Endpoints to manipulate room names.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const roomNamesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the room name event of a room.
     */
    getRoomName: builder.query<
      { event: StateEvent<RoomNameEvent> | undefined },
      { roomId: string }
    >({
      queryFn: async ({ roomId }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_NAME,
            { roomIds: [roomId] }
          );

          return {
            data: { event: first(events.filter(isValidRoomNameEvent)) },
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load the room name: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        { roomId },
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_NAME, {
            roomIds: [roomId],
          })
          .pipe(filter(isValidRoomNameEvent))
          .subscribe((event) => {
            updateCachedData(() => ({ event }));
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    patchRoomName: builder.mutation<
      { event: StateEvent<RoomNameEvent> },
      { roomId?: string; changes: Partial<RoomNameEvent> }
    >({
      // @ts-ignore - RTK Query return type mismatch ISendEventFromWidgetResponseData vs StateEvent
      async queryFn({ roomId, changes }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const roomNameEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_NAME,
            { roomIds: roomId ? [roomId] : undefined, stateKey: '' }
          );
          const roomNameEvent = last(
            roomNameEvents.filter(isValidRoomNameEvent)
          );

          if (!roomNameEvent) {
            return {
              error: {
                name: 'UpdateFailed',
                message: 'No m.room.name event found',
              },
            };
          }

          const roomName = merge({}, roomNameEvent.content, changes);

          if (isEqual(roomNameEvent.content, roomName)) {
            // No change necessary
            return { data: { event: roomNameEvent } };
          }

          const event = await widgetApi.sendStateEvent(
            STATE_EVENT_ROOM_NAME,
            roomName,
            { roomId }
          );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update room name: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const { useGetRoomNameQuery, usePatchRoomNameMutation } = roomNamesApi;
