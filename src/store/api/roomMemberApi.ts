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

import {
  isValidRoomMemberStateEvent,
  RoomMemberStateEventContent,
  StateEvent,
  STATE_EVENT_ROOM_MEMBER,
} from '@matrix-widget-toolkit/api';
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { isError } from 'lodash';
import { Symbols } from 'matrix-widget-api';
import { bufferTime, filter } from 'rxjs';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';
import { spaceApi } from './spaceApi';

const roomMemberEventEntityAdapter = createEntityAdapter({
  selectId: (event: StateEvent<RoomMemberStateEventContent>) => event.state_key,
});

/**
 * Endpoints to access room member events of the space to show the users display
 * names.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const roomMemberApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the room member events from the space room.
     */
    getRoomMembers: builder.query<
      EntityState<StateEvent<RoomMemberStateEventContent>, string>,
      void
    >({
      providesTags: () => ['SpaceRoom'],

      queryFn: async (_, { extra, dispatch }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const initialState = roomMemberEventEntityAdapter.getInitialState();

          const { spaceId } = await dispatch(
            spaceApi.endpoints.getSpaceRoom.initiate()
          ).unwrap();

          if (!spaceId) {
            return { data: initialState };
          }

          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_MEMBER,
            { roomIds: [spaceId] }
          );

          return {
            data: roomMemberEventEntityAdapter.addMany(
              initialState,
              events.filter(isValidRoomMemberStateEvent)
            ),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load room members: ${
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
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const spaceRoomSubscription = dispatch(
          spaceApi.endpoints.getSpaceRoom.initiate()
        );

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_MEMBER, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomMemberStateEvent),
            bufferTime(0),
            filter((list) => list.length > 0)
          )
          .subscribe(async (events) => {
            const { spaceId } = await dispatch(
              spaceApi.endpoints.getSpaceRoom.initiate()
            ).unwrap();

            const changeEvents = events?.filter((ev) => ev.room_id === spaceId) ?? [];

            if (changeEvents.length > 0) {
              updateCachedData((state) =>
                roomMemberEventEntityAdapter.upsertMany(state, changeEvents)
              );
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

export const { selectAll: selectRoomMembers, selectById: selectRoomMember } =
  roomMemberEventEntityAdapter.getSelectors();

export const { useGetRoomMembersQuery } = roomMemberApi;
