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

import {
  hasStateEventPower,
  isValidPowerLevelStateEvent,
  isValidRoomMemberStateEvent,
  StateEvent,
  STATE_EVENT_POWER_LEVELS,
  STATE_EVENT_ROOM_MEMBER,
} from '@matrix-widget-toolkit/api';
import { first, intersection, isEqual, isError, last } from 'lodash';
import { Symbols } from 'matrix-widget-api';
import { bufferTime, filter, map, merge, mergeMap } from 'rxjs';
import {
  isCanonicalSpaceParentEvent,
  isJoinableSpaceChildEvent,
  isValidRoomCreateEvent,
  isValidRoomNameEvent,
  isValidSessionGridEvent,
  isValidSpaceChildEvent,
  isValidSpaceParentEvent,
  LinkedRoomEvent,
  SpaceChildEvent,
  STATE_EVENT_BARCAMP_LINKED_ROOM,
  STATE_EVENT_BARCAMP_SESSION_GRID,
  STATE_EVENT_ROOM_CREATE,
  STATE_EVENT_ROOM_NAME,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';
import { linkedRoomApi, selectLinkedRoom } from './linkedRoomApi';
import { STATE_EVENT_SPACE_PARENT } from '../../lib/events/spaceParentEvent';
import { STATE_EVENT_SPACE_CHILD } from '../../lib/events/spaceChildEvent';

/**
 * All endpoints that concern the storage locations of the
 * individual Matrix events.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const spaceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Return the room_id of the parent space, or undefined if missing.
     */
    getSpaceRoom: builder.query<{ spaceId: string }, void>({
      queryFn: async (_, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        // FOSDEM: use the current room to store everything that was intended for the space room
        if (widgetApi.widgetParameters.roomId) {
          return {
            data: {
              spaceId: widgetApi.widgetParameters.roomId,
            },
          };
        }

        try {
          // get the canonical space event of the current room
          const spaceParentEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_SPACE_PARENT
          );
          const [spaceParent] = spaceParentEvents
            .filter(isValidSpaceParentEvent)
            .filter(isCanonicalSpaceParentEvent)
            .sort((a, b) => a.state_key.localeCompare(b.state_key));

          if (!spaceParent) {
            return {
              error: {
                name: 'LoadFailed',
                message: 'Could not determine space room',
              },
            };
          }

          // check if the parent is a space
          const roomCreateEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_CREATE,
            { roomIds: [spaceParent.state_key], stateKey: '' }
          );

          const isSpace = roomCreateEvents
            .filter(isValidRoomCreateEvent)
            .some((ev) => ev.content.type === 'm.space');

          if (!isSpace) {
            return {
              error: {
                name: 'LoadFailed',
                message: 'Could not determine space room',
              },
            };
          }

          // the space has a child event to the current room
          const spaceChildEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_SPACE_CHILD,
            {
              stateKey: widgetApi.widgetParameters.roomId,
              roomIds: [spaceParent.state_key],
            }
          );

          const hasSpaceChildEvent = spaceChildEvents
            .filter(isValidSpaceChildEvent)
            .some(isJoinableSpaceChildEvent);

          if (!hasSpaceChildEvent) {
            return {
              error: {
                name: 'LoadFailed',
                message: 'Could not determine space room',
              },
            };
          }

          return { data: { spaceId: spaceParent.state_key } };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not determine space room: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheEntryRemoved, extra, getCacheEntry, dispatch }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        return;

        // don't wait until first data is cached because we want to observe
        // the room for events even though the first call failed. This makes
        // sure that we can notify the store if the space connection is
        // established while the widget is open.

        // A change in a m.space.parent event affects the room
        // of the event and the parent space
        const spaceParentEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_SPACE_PARENT)
          .pipe(
            filter(isValidSpaceParentEvent),
            mergeMap((ev) => [ev.state_key, ev.room_id])
          );

        // A change in a m.space.change event affects the space
        // of the event and the child room
        const spaceChildEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_SPACE_CHILD, {
            roomIds: Symbols.AnyRoom,
            stateKey: widgetApi.widgetParameters.roomId,
          })
          .pipe(
            filter(isValidSpaceChildEvent),
            mergeMap((ev) => [ev.state_key, ev.room_id])
          );

        // A change in a m.room.create event affects the space.
        // These events can't change, but they can appear later.
        const roomCreateEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_CREATE, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomCreateEvent),
            map((ev) => ev.room_id)
          );

        // @ts-ignore - Observable type mismatch between RxJS versions
        const subscription = merge(
          // @ts-ignore - Observable type mismatch between RxJS versions
          spaceParentEventChanges,
          spaceChildEventChanges,
          roomCreateEventChanges
        )
          .pipe(
            bufferTime(0),
            mergeMap((list) => new Set(list))
          )
          .subscribe(async (roomId) => {
            const cache = getCacheEntry();

            if (cache.isLoading) {
              return;
            }

            if (
              cache.isError ||
              cache?.data?.spaceId === undefined ||
              cache?.data?.spaceId === roomId ||
              roomId === widgetApi.widgetParameters.roomId
            ) {
              const oldCache = getCacheEntry();
              const newCacheEntry = await dispatch(
                spaceApi.endpoints.getSpaceRoom.initiate(undefined, {
                  forceRefetch: true,
                })
              );

              if (
                oldCache.isSuccess !== newCacheEntry.isSuccess ||
                !isEqual(oldCache.data, newCacheEntry.data)
              ) {
                dispatch(spaceApi.util.invalidateTags([{ type: 'SpaceRoom' }]));
              }
            }
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    /**
     * Return the room_id of the lobby room, or undefined if missing.
     */
    getLobbyRoom: builder.query<{ roomId: string }, void>({
      providesTags: () => ['SpaceRoom', 'LinkedRoom'],

      queryFn: async (_, { extra, dispatch }) => {
        const { widgetApi } = extra as ThunkExtraArgument;
        let roomId = widgetApi.widgetParameters.roomId ?? '';

        try {
          const linkedRooms = await dispatch(
            linkedRoomApi.endpoints.getLinkedRooms.initiate()
          ).unwrap();

          // linkedRooms is undefined if recovering from previous failures
          if (linkedRooms) {
            const linkedRoom = selectLinkedRoom(linkedRooms, roomId);

            if (linkedRoom) {
              // This is a session room, find the related lobby room
              roomId = linkedRoom.content.sessionGridId;
            }
          }

          // Cast to string to break the circular type dependency
          // @ts-ignore - spaceId can be undefined
          const spaceId = (
            await dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
          ).spaceId as string;

          // check if the current room is a lobby room
          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_BARCAMP_SESSION_GRID,
            {
              // roomIds: [spaceId],
              stateKey: roomId,
            }
          );

          const gridEvent = first(events.filter(isValidSessionGridEvent));

          if (!gridEvent) {
            return {
              error: {
                name: 'NoLobby',
                message: 'Could not determine lobby room',
              },
            };
          }

          return { data: { roomId: gridEvent.state_key } };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not determine lobby room: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheEntryRemoved, dispatch, extra, getCacheEntry }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // make sure the `getSpaceRoom` and `getLinkedRooms` endpoints keep
        // updating
        const getSpaceRoomSubscription = dispatch(
          spaceApi.endpoints.getSpaceRoom.initiate()
        );
        const getLinkedRoomsSubscription = dispatch(
          linkedRoomApi.endpoints.getLinkedRooms.initiate()
        );

        const sessionGridSubscription = widgetApi
          .observeStateEvents(STATE_EVENT_BARCAMP_SESSION_GRID, {
            // roomIds: Symbols.AnyRoom,
            stateKey: widgetApi.widgetParameters.roomId,
          })
          .pipe(filter(isValidSessionGridEvent))
          .subscribe(async () => {
            const cache = getCacheEntry();

            if (cache.isError) {
              await dispatch(
                spaceApi.endpoints.getLobbyRoom.initiate(undefined, {
                  forceRefetch: true,
                })
              );
            }
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        getLinkedRoomsSubscription.unsubscribe();
        getSpaceRoomSubscription.unsubscribe();
        sessionGridSubscription.unsubscribe();
      },
    }),

    /**
     * Return a list of rooms that can qualify to be assigned to a session/topic.
     */
    getUnassignedRooms: builder.query<
      Array<{ roomId: string; roomName: string }>,
      void
    >({
      providesTags: () => ['SpaceRoom', 'LinkedRoom'],

      queryFn: async (_, { extra, dispatch }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          // Cast to string to break the circular type dependency
          const spaceId = (
            await dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
          ).spaceId as string;

          // only consider events that are children of our space
          const spaceChildEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_SPACE_CHILD,
            { roomIds: [spaceId] }
          );

          let potentialRoomIds = spaceChildEvents
            .filter(isValidSpaceChildEvent)
            .filter(isJoinableSpaceChildEvent)
            .map((ev) => ev.state_key);

          // only consider events that have our space as a canonical parent
          const spaceParentEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_SPACE_PARENT,
            { roomIds: potentialRoomIds, stateKey: spaceId }
          );
          const allSpaceParents = spaceParentEvents
            .filter(isValidSpaceParentEvent)
            .filter(isCanonicalSpaceParentEvent)
            .map((ev) => ev.room_id);

          potentialRoomIds = intersection(potentialRoomIds, allSpaceParents);

          // only consider rooms without type
          const roomCreateEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_CREATE,
            { roomIds: potentialRoomIds, stateKey: '' }
          );
          const allRoomTypes = roomCreateEvents.filter(isValidRoomCreateEvent);

          potentialRoomIds = potentialRoomIds.filter((roomId) =>
            allRoomTypes.some(
              (ev) => ev.room_id === roomId && ev.content.type === undefined
            )
          );

          // skip all rooms that are already linked
          const linkedRoomsState = await dispatch(
            linkedRoomApi.endpoints.getLinkedRooms.initiate()
          ).unwrap();

          potentialRoomIds = potentialRoomIds.filter(
            (id) => selectLinkedRoom(linkedRoomsState, id) === undefined
          );

          // skip all rooms that already serve as a lobby
          const sessionGridEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_BARCAMP_SESSION_GRID,
            { roomIds: [spaceId] }
          );
          const allSessionGridEvents = sessionGridEvents.filter(
            isValidSessionGridEvent
          );

          potentialRoomIds = potentialRoomIds.filter(
            (id) => !allSessionGridEvents.some((ev) => ev.state_key === id)
          );

          // only show rooms where the user joined. The client might return
          // cached data for non-joined rooms.
          const roomMemberEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_MEMBER,
            {
              roomIds: potentialRoomIds,
              stateKey: widgetApi.widgetParameters.userId,
            }
          );
          const allRoomMemberEvents = roomMemberEvents.filter(
            isValidRoomMemberStateEvent
          );

          potentialRoomIds = potentialRoomIds.filter((id) =>
            allRoomMemberEvents.some(
              (ev) => ev.room_id === id && ev.content.membership === 'join'
            )
          );

          // only show rooms where the user has the power to change them
          const powerLevelEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_POWER_LEVELS,
            { roomIds: potentialRoomIds, stateKey: '' }
          );
          const allPowerLevelEvents = powerLevelEvents.filter(
            isValidPowerLevelStateEvent
          );

          potentialRoomIds = potentialRoomIds.filter((roomId) => {
            const event = allPowerLevelEvents.find(
              (ev) => ev.room_id === roomId
            );

            // TODO: check all event types that should be written:
            // - name
            // - topic
            // - widget
            // - widget layout

            return hasStateEventPower(
              event?.content,
              undefined, // no createRoomStateEvent needed for room name checks
              widgetApi.widgetParameters.userId,
              STATE_EVENT_ROOM_NAME
            );
          });

          // get the names of all the rooms
          const roomNameEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_NAME,
            { roomIds: potentialRoomIds }
          );
          const allRoomNameEvents = roomNameEvents.filter(isValidRoomNameEvent);

          return {
            data: allRoomNameEvents.map((ev) => ({
              roomId: ev.room_id,
              roomName: ev.content.name,
            })),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not determine space room: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, getCacheEntry, dispatch }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        // A change in a m.space.parent event affects the room
        // of the event
        const spaceParentEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_SPACE_PARENT, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidSpaceParentEvent),
            map((ev) => ev.room_id)
          );

        // A change in a m.space.change event affects the child room
        const spaceChildEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_SPACE_CHILD, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidSpaceChildEvent),
            mergeMap((ev) => [ev.state_key, ev.room_id])
          );

        // A change in a m.room.create event affects the room.
        // These events can't change, but they can appear later.
        const roomCreateEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_CREATE, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomCreateEvent),
            map((ev) => ev.room_id)
          );

        // A change in the room members affects the room
        const roomMemberEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_MEMBER, {
            roomIds: Symbols.AnyRoom,
            stateKey: widgetApi.widgetParameters.userId,
          })
          .pipe(
            filter(isValidRoomMemberStateEvent),
            map((ev) => ev.room_id)
          );

        // A change in the power levels affects the room
        const powerLevelEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_POWER_LEVELS, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidPowerLevelStateEvent),
            map((ev) => ev.room_id)
          );

        // A change in the name affects the room
        const roomNameEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_ROOM_NAME, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidRoomNameEvent),
            map((ev) => ev.room_id)
          );

        // A change in the a session grid affects the
        // connected lobby room
        const sessionGridEventChanges = widgetApi
          .observeStateEvents(STATE_EVENT_BARCAMP_SESSION_GRID, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidSessionGridEvent),
            map((ev) => ev.state_key)
          );

        // @ts-ignore - Observable type mismatch between RxJS versions
        const subscription = merge(
          // @ts-ignore - Observable type mismatch between RxJS versions
          spaceParentEventChanges,
          spaceChildEventChanges,
          roomCreateEventChanges,
          roomMemberEventChanges,
          powerLevelEventChanges,
          roomNameEventChanges,
          sessionGridEventChanges
        ).subscribe(async () => {
          const cache = getCacheEntry();

          if (cache.isLoading) {
            return;
          }

          await dispatch(
            spaceApi.endpoints.getUnassignedRooms.initiate(undefined, {
              forceRefetch: true,
            })
          );
        });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    assignLinkedRoom: builder.mutation<
      { event: StateEvent<LinkedRoomEvent> },
      { topicId: string; roomId: string; sessionGridId: string }
    >({
      // @ts-ignore - RTK Query return type mismatch ISendEventFromWidgetResponseData vs StateEvent
      async queryFn({ roomId, sessionGridId, topicId }, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          // Cast to string to break the circular type dependency
          // @ts-ignore - spaceId can be undefined
          const spaceId = (
            await dispatch(spaceApi.endpoints.getSpaceRoom.initiate()).unwrap()
          ).spaceId as string;

          const event = await widgetApi.sendStateEvent<LinkedRoomEvent>(
            STATE_EVENT_BARCAMP_LINKED_ROOM,
            { topicId, sessionGridId },
            {
              stateKey: roomId,
              // roomId: spaceId
            }
          );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not assign room to a topic: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),

    markRoomAsSuggested: builder.mutation<
      StateEvent<SpaceChildEvent>,
      { spaceId: string; roomId: string }
    >({
      // @ts-ignore - RTK Query return type mismatch ISendEventFromWidgetResponseData vs StateEvent
      async queryFn({ spaceId, roomId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const spaceChildEvents = await widgetApi.receiveStateEvents(
            STATE_EVENT_SPACE_CHILD,
            { stateKey: roomId, roomIds: [spaceId] }
          );
          const spaceChildEvent = last(
            spaceChildEvents
              .filter(isValidSpaceChildEvent)
              .filter(isJoinableSpaceChildEvent)
          );

          if (!spaceChildEvent) {
            throw new Error('No space child event found');
          }

          const spaceChild = {
            ...spaceChildEvent.content,
            suggested: true,
            order: ' lobby', // Prefix with space to sort first
          };

          if (spaceChildEvent && isEqual(spaceChildEvent.content, spaceChild)) {
            // No change necessary
            return { data: spaceChildEvent };
          }

          const data = await widgetApi.sendStateEvent(
            STATE_EVENT_SPACE_CHILD,
            spaceChild,
            {
              stateKey: roomId,
              // roomId: spaceId
            }
          );

          return { data };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update space child: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const {
  useGetSpaceRoomQuery,
  useGetUnassignedRoomsQuery,
  useAssignLinkedRoomMutation,
  useMarkRoomAsSuggestedMutation,
} = spaceApi;
