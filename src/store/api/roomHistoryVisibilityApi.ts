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
import { isEqual, isError, last, merge } from 'lodash';
import {
  isValidRoomHistoryVisibilityEvent,
  RoomHistoryVisibilityEvent,
  STATE_EVENT_ROOM_HISTORY_VISIBILITY,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

/**
 * Endpoints to manipulate room history visibility.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const roomHistoryVisibilityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    patchRoomHistoryVisibility: builder.mutation<
      { event: StateEvent<RoomHistoryVisibilityEvent> },
      { roomId?: string; changes: Partial<RoomHistoryVisibilityEvent> }
    >({
      // @ts-ignore - RTK Query return type mismatch ISendEventFromWidgetResponseData vs StateEvent
      async queryFn({ roomId, changes }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const roomHistoryVisibilityEvents =
            await widgetApi.receiveStateEvents(
              STATE_EVENT_ROOM_HISTORY_VISIBILITY,
              {
                // roomIds: roomId ? [roomId] : undefined,
                stateKey: ''
              }
            );

          const roomHistoryVisibilityEvent = last(
            roomHistoryVisibilityEvents.filter(
              isValidRoomHistoryVisibilityEvent
            )
          );

          const roomHistoryVisibility = merge(
            {},
            roomHistoryVisibilityEvent?.content ?? {},
            changes
          ) as RoomHistoryVisibilityEvent;

          if (
            roomHistoryVisibilityEvent &&
            isEqual(roomHistoryVisibilityEvent?.content, roomHistoryVisibility)
          ) {
            // No change necessary
            return { data: { event: roomHistoryVisibilityEvent } };
          }

          const event =
            await widgetApi.sendStateEvent<RoomHistoryVisibilityEvent>(
              STATE_EVENT_ROOM_HISTORY_VISIBILITY,
              roomHistoryVisibility,
              // { roomId }
            );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update room history_visibility: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const { usePatchRoomHistoryVisibilityMutation } =
  roomHistoryVisibilityApi;
