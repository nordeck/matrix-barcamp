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
  isValidRoomTopicEvent,
  RoomTopicEvent,
  STATE_EVENT_ROOM_TOPIC,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

/**
 * Endpoints to manipulate room topics.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const roomTopicsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    patchRoomTopic: builder.mutation<
      { event: StateEvent<RoomTopicEvent> },
      { roomId?: string; changes: RoomTopicEvent }
    >({
      // @ts-ignore - RTK Query return type mismatch ISendEventFromWidgetResponseData vs StateEvent
      async queryFn({ roomId, changes }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const roomTopicEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_TOPIC,
            { roomIds: roomId ? [roomId] : undefined, stateKey: '' }
          );
          const roomTopicEvent = last(
            roomTopicEvents.filter(isValidRoomTopicEvent)
          );

          const roomTopic = merge({}, roomTopicEvent?.content ?? {}, changes);

          if (roomTopicEvent && isEqual(roomTopicEvent?.content, roomTopic)) {
            // No change necessary
            return { data: { event: roomTopicEvent } };
          }

          const event = await widgetApi.sendStateEvent(
            STATE_EVENT_ROOM_TOPIC,
            roomTopic,
            { roomId }
          );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update room topic: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const { usePatchRoomTopicMutation } = roomTopicsApi;
