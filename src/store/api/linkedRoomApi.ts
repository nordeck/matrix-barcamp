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

/* eslint-disable no-unreachable */

import { compareOriginServerTS, StateEvent } from '@matrix-widget-toolkit/api';
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { isError } from 'lodash';
import { Symbols } from 'matrix-widget-api';
import { bufferTime, filter } from 'rxjs';
import {
  isValidLinkedRoomEvent,
  LinkedRoomEvent,
  STATE_EVENT_BARCAMP_LINKED_ROOM,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';
import { spaceApi } from './spaceApi';

export const linkedRoomsEntityAdapter = createEntityAdapter<
  StateEvent<LinkedRoomEvent>
>({
  selectId: (event) => event.state_key,
  sortComparer: compareOriginServerTS,
});

/**
 * All endpoints that concern the linked room events that should
 * be displayed in the grid.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const linkedRoomApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Internal endpoint to hold a cache of all linked rooms in the space room.
     */
    getLinkedRooms: builder.query<
      EntityState<StateEvent<LinkedRoomEvent>>,
      void
    >({
      providesTags: () => ['SpaceRoom'],

      async queryFn(_, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          return { data: linkedRoomsEntityAdapter.getInitialState() };
          const { spaceId } = await dispatch(
            spaceApi.endpoints.getSpaceRoom.initiate()
          ).unwrap();

          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_BARCAMP_LINKED_ROOM,
            { roomIds: [spaceId] }
          );

          return {
            data: linkedRoomsEntityAdapter.addMany(
              linkedRoomsEntityAdapter.getInitialState(),
              events.filter(isValidLinkedRoomEvent)
            ),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load linked rooms: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        {
          cacheDataLoaded,
          cacheEntryRemoved,
          extra,
          updateCachedData,
          dispatch,
        }
      ) {
        return;

        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const spaceRoomSubscription = dispatch(
          spaceApi.endpoints.getSpaceRoom.initiate()
        );

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_BARCAMP_LINKED_ROOM, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidLinkedRoomEvent),
            bufferTime(0),
            filter((list) => list.length > 0)
          )
          .subscribe(async (events) => {
            const { spaceId } = await dispatch(
              spaceApi.endpoints.getSpaceRoom.initiate()
            ).unwrap();

            const changeEvents = events.filter((ev) => ev.room_id === spaceId);

            if (changeEvents.length > 0) {
              updateCachedData((state) =>
                linkedRoomsEntityAdapter.upsertMany(state, changeEvents)
              );

              // invalidate the cache entry
              dispatch(linkedRoomApi.util.invalidateTags(['LinkedRoom']));
            }
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
        spaceRoomSubscription.unsubscribe();
      },
    }),
  }),
});

export const { selectAll: selectLinkedRooms, selectById: selectLinkedRoom } =
  linkedRoomsEntityAdapter.getSelectors();

export function selectLinkedRoomForTopic(
  state: EntityState<StateEvent<LinkedRoomEvent>>,
  topicId: string,
  sessionGridId?: string
): StateEvent<LinkedRoomEvent> | undefined {
  return selectLinkedRooms(state).find(
    (event) =>
      event.content.topicId === topicId &&
      (!sessionGridId || event.content.sessionGridId === sessionGridId)
  );
}

export const { useGetLinkedRoomsQuery } = linkedRoomApi;
