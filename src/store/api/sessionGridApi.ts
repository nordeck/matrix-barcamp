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
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import {
  BaseQueryApi,
  QueryReturnValue,
} from '@reduxjs/toolkit/dist/query/baseQueryTypes';
import { Recipe } from '@reduxjs/toolkit/dist/query/core/buildThunks';
import { t } from 'i18next';
import produce from 'immer';
import { first, isError, last } from 'lodash';
import { DateTime, Duration } from 'luxon';
import { Symbols } from 'matrix-widget-api';
import { nanoid } from 'nanoid';
import { bufferTime, filter } from 'rxjs';
import { randomIcon } from '../../components/IconPicker';
import {
  CommonEventTimeSlotChanges,
  TimeSlotChanges,
} from '../../components/SessionGrid';
import { TrackChanges } from '../../components/SessionGrid/TrackTitle';
import {
  isValidSessionGridEvent,
  ROOM_EVENT_BARCAMP_SESSION_GRID_START,
  SessionGridEvent,
  SessionGridStartEvent,
  STATE_EVENT_BARCAMP_SESSION_GRID,
  TimeSlot,
  TimeSlotTypes,
  Track,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi, BaseApiError } from './baseApi';
import { recalculateTimeSlotTimestamps } from './helper';
import { spaceApi } from './spaceApi';
import { topicApi } from './topicApi';
import {
  selectAvailableSubmittedTopics,
  topicSubmissionApi,
} from './topicSubmissionApi';

type GetSessionGridResult =
  | { event?: StateEvent<SessionGridEvent>; error?: undefined }
  | { event?: undefined; error: 'NoSpace' | 'NoSessionGrid' };

/**
 * All endpoints that concern the session grid.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const sessionGridApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessionGrid: builder.query<GetSessionGridResult, void>({
      providesTags: () => ['SpaceRoom'],

      async queryFn(_, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        const { spaceId: roomId } =
          (await dispatch(spaceApi.endpoints.getSpaceRoom.initiate())
            .unwrap()
            .catch(() => undefined)) ?? {};

        if (!roomId) {
          return { data: { error: 'NoSpace' } };
        }

        const { roomId: stateKey } =
          (await dispatch(spaceApi.endpoints.getLobbyRoom.initiate())
            .unwrap()
            .catch(() => undefined)) ?? {};

        if (!stateKey) {
          return { data: { error: 'NoSessionGrid' } };
        }

        try {
          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_BARCAMP_SESSION_GRID,
            { roomIds: [roomId], stateKey }
          );

          const gridEvent = last(events.filter(isValidSessionGridEvent));

          if (!gridEvent) {
            return {
              error: {
                name: 'LoadFailed',
                message: 'Could not load the session grid',
              },
            };
          }

          return { data: { event: gridEvent } };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load the session grid: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheEntryRemoved, extra, updateCachedData, dispatch, getCacheEntry }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // don't wait until first data is cached because we want to observe
        // the room for events even though the first call failed. This makes
        // sure we recognize a new session grid event after an error.

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_BARCAMP_SESSION_GRID, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidSessionGridEvent),
            bufferTime(0),
            filter((list) => list.length > 0)
          )
          .subscribe(async (allEvents) => {
            try {
              const { spaceId: roomId } = await dispatch(
                spaceApi.endpoints.getSpaceRoom.initiate()
              ).unwrap();
              const { roomId: stateKey } = await dispatch(
                spaceApi.endpoints.getLobbyRoom.initiate()
              ).unwrap();

              const events = allEvents.filter(
                (ev) => ev.room_id === roomId && ev.state_key === stateKey
              );

              if (events.length > 0) {
                updateCachedData(() => ({
                  event: events[events.length - 1],
                }));
              }
            } catch {
              // empty
            }
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    setupSessionGrid: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      void
    >({
      invalidatesTags: ['SpaceRoom'],
      async queryFn(_, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        const { spaceId: roomId } =
          (await dispatch(spaceApi.endpoints.getSpaceRoom.initiate())
            .unwrap()
            .catch(() => undefined)) ?? {};

        if (!roomId) {
          return { error: { name: 'UpdateFailed', message: 'No space found' } };
        }

        const stateKey = widgetApi.widgetParameters.roomId;

        if (!stateKey) {
          return {
            error: { name: 'UpdateFailed', message: 'Current room unknown' },
          };
        }

        try {
          const startEvent =
            await widgetApi.sendRoomEvent<SessionGridStartEvent>(
              ROOM_EVENT_BARCAMP_SESSION_GRID_START,
              {}
            );

          const content: SessionGridEvent = {
            consumedTopicSubmissions: [],
            parkingLot: [],
            sessions: [],
            timeSlots: [createTimeSlot()],
            tracks: [createTrack()],
            topicStartEventId: startEvent.event_id,
          };

          const event = await widgetApi.sendStateEvent(
            STATE_EVENT_BARCAMP_SESSION_GRID,
            content,
            { roomId, stateKey }
          );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not create session grid: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),

    addTrack: builder.mutation<{ event: StateEvent<SessionGridEvent> }, void>({
      async queryFn(_, api) {
        return await updateSessionGrid(api, (state) => {
          const count = state.tracks.length;

          state.tracks.push(createTrack(count));
        });
      },
    }),

    updateTrack: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { trackId: string; changes: TrackChanges }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          state.tracks = state.tracks.map((t) => {
            if (t.id === action.trackId) {
              return {
                ...t,
                ...action.changes,
              };
            }

            return t;
          });
        });
      },
    }),

    deleteTimeSlot: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { timeSlotId: string }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          if (state.timeSlots.length <= 1) {
            throw new Error('Can not delete last time slot');
          }

          const parkingLotTopics = [
            ...state.sessions
              .filter((session) => session.timeSlotId === action.timeSlotId)
              .map((session) => ({ topicId: session.topicId })),
            ...state.parkingLot,
          ];

          const timeSlots = state.timeSlots.filter(
            (timeSlot) => timeSlot.id !== action.timeSlotId
          );

          state.parkingLot = parkingLotTopics;
          state.sessions = state.sessions.filter(
            (session) => session.timeSlotId !== action.timeSlotId
          );
          state.timeSlots = recalculateTimeSlotTimestamps(timeSlots, {
            forcedStartTime: DateTime.fromISO(state.timeSlots[0].startTime),
          });
        });
      },
    }),

    deleteTrack: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { trackId: string }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          if (state.tracks.length <= 1) {
            throw new Error('Can not delete last track');
          }

          const oldTopics = state.sessions
            .filter((session) => session.trackId === action.trackId)
            .map(({ topicId }) => ({ topicId }));

          state.parkingLot.unshift(...oldTopics);
          state.sessions = state.sessions.filter(
            (session) => session.trackId !== action.trackId
          );
          state.tracks = state.tracks.filter(
            (track) => track.id !== action.trackId
          );
        });
      },
    }),

    addTimeSlot: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { timeSlotType: TimeSlotTypes }
    >({
      async queryFn({ timeSlotType }, api) {
        return await updateSessionGrid(api, (state) => {
          const timeSlots = state.timeSlots.concat(
            createTimeSlot(timeSlotType)
          );

          state.timeSlots = recalculateTimeSlotTimestamps(timeSlots);
        });
      },
    }),

    updateCommonEvent: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { timeSlotId: string; changes: CommonEventTimeSlotChanges }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          state.timeSlots = state.timeSlots.map((t) => {
            if (t.id === action.timeSlotId && t.type === 'common-event') {
              return {
                ...t,
                ...action.changes,
              };
            }

            return t;
          });
        });
      },
    }),

    updateTimeSlot: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { timeSlotId: string; changes: TimeSlotChanges }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          if (action.changes.startTime !== undefined) {
            if (action.timeSlotId === state.timeSlots[0]?.id) {
              state.timeSlots = recalculateTimeSlotTimestamps(state.timeSlots, {
                forcedStartTime: DateTime.fromISO(action.changes.startTime),
              });
            } else {
              throw new Error(
                'Only start time of first timeslot can be changed.'
              );
            }
          }

          if (action.changes.durationMinutes !== undefined) {
            const timeSlots = state.timeSlots.map((timeSlot) => {
              if (timeSlot.id === action.timeSlotId) {
                const startTime = DateTime.fromISO(timeSlot.startTime);
                const duration = Duration.fromDurationLike({
                  minutes: action.changes.durationMinutes,
                });
                const endTime = startTime.plus(duration);

                return {
                  ...timeSlot,
                  endTime: endTime.toISO(),
                };
              }

              return timeSlot;
            });

            state.timeSlots = recalculateTimeSlotTimestamps(timeSlots);
          }
        });
      },
    }),

    deleteTopic: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { topicId: string }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          state.sessions = state.sessions.filter(
            (session) => session.topicId !== action.topicId
          );

          state.parkingLot = state.parkingLot.filter(
            ({ topicId }) => topicId !== action.topicId
          );
        });
      },
    }),

    moveTimeSlot: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { timeSlotId: string; toIndex: number }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          const timeSlot = state.timeSlots.find(
            (t) => t.id === action.timeSlotId
          );

          if (!timeSlot) {
            throw new Error(`Time slot not found: ${action.timeSlotId}`);
          }

          const timeSlots = state.timeSlots.filter(
            (t) => t.id !== action.timeSlotId
          );
          timeSlots.splice(action.toIndex, 0, timeSlot);

          state.timeSlots = recalculateTimeSlotTimestamps(timeSlots, {
            forcedStartTime: DateTime.fromISO(state.timeSlots[0].startTime),
          });
        });
      },
    }),

    selectNextTopic: builder.mutation<
      { event: StateEvent<SessionGridEvent> | undefined },
      void
    >({
      async queryFn(_, api) {
        const { dispatch } = api;

        const { event: sessionGrid } = await dispatch(
          sessionGridApi.endpoints.getSessionGrid.initiate()
        ).unwrap();

        if (!sessionGrid) {
          return {
            error: { name: 'UpdateFailed', message: 'No session grid event' },
          };
        }

        const topicSubmissions = await dispatch(
          topicSubmissionApi.endpoints.getTopicSubmissions.initiate()
        ).unwrap();
        const availableTopicSubmissions = selectAvailableSubmittedTopics(
          topicSubmissions,
          sessionGrid.content.consumedTopicSubmissions
        );
        const nextTopicSubmission = first(availableTopicSubmissions);

        if (!nextTopicSubmission) {
          return {
            error: {
              name: 'UpdateFailed',
              message: 'No next topic submission',
            },
          };
        }

        const topicId = nextTopicSubmission.event_id;

        // create the topic
        await dispatch(
          topicApi.endpoints.createTopic.initiate({
            id: topicId,
            content: {
              title: nextTopicSubmission.content.title,
              description: nextTopicSubmission.content.description,
              authors: [{ id: nextTopicSubmission.sender }],
            },
          })
        );

        return await updateSessionGrid(api, (state) => {
          if (!state.consumedTopicSubmissions.includes(topicId)) {
            state.consumedTopicSubmissions.push(topicId);
            state.parkingLot.unshift({ topicId });
          }
        });
      },
    }),

    moveTopicToSession: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { topicId: string; trackId: string; timeSlotId: string }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          const topic =
            state.parkingLot.find((t) => t.topicId === action.topicId) ??
            state.sessions.find((s) => s.topicId === action.topicId);

          if (!topic) {
            throw new Error(`Topic not found: ${action.topicId}`);
          }

          if (!state.tracks.find((t) => t.id === action.trackId)) {
            throw new Error(`Track not found: ${action.trackId}`);
          }

          if (
            !state.timeSlots.find(
              (t) => t.id === action.timeSlotId && t.type === 'sessions'
            )
          ) {
            throw new Error(`Time slot not found: ${action.timeSlotId}`);
          }

          if (
            state.sessions.find(
              (s) =>
                s.timeSlotId === action.timeSlotId &&
                s.trackId === action.trackId &&
                s.topicId !== action.topicId
            )
          ) {
            throw new Error(
              `Session already in use: ${action.timeSlotId}, ${action.trackId}`
            );
          }

          const parkingLotTopics = state.parkingLot.filter(
            (t) => t.topicId !== action.topicId
          );
          const sessions = [
            ...state.sessions.filter((s) => s.topicId !== action.topicId),
            {
              topicId: action.topicId,
              timeSlotId: action.timeSlotId,
              trackId: action.trackId,
            },
          ];

          state.sessions = sessions;
          state.parkingLot = parkingLotTopics;
        });
      },
    }),

    moveTopicToParkingArea: builder.mutation<
      { event: StateEvent<SessionGridEvent> },
      { topicId: string; toIndex: number }
    >({
      async queryFn(action, api) {
        return await updateSessionGrid(api, (state) => {
          const topic =
            state.parkingLot.find((t) => t.topicId === action.topicId) ??
            state.sessions.find((s) => s.topicId === action.topicId);

          if (!topic) {
            throw new Error(`Topic not found: ${action.topicId}`);
          }

          const parkingLotTopics = state.parkingLot.filter(
            (t) => t.topicId !== action.topicId
          );
          const sessions = state.sessions.filter(
            (s) => s.topicId !== action.topicId
          );

          parkingLotTopics.splice(action.toIndex, 0, {
            topicId: topic.topicId,
          });

          state.sessions = sessions;
          state.parkingLot = parkingLotTopics;
        });
      },
    }),
  }),
});

function createTrack(index: number = 0): Track {
  const icon = randomIcon();

  return {
    id: nanoid(),
    name: t('track.newName', 'Track {{suffix}}', {
      suffix: index + 1,
    }),
    icon,
  };
}

function createTimeSlot(timeSlotType: TimeSlotTypes = 'sessions'): TimeSlot {
  const startTime = DateTime.fromObject({ hour: 10 });
  const endTime = startTime.plus({ hours: 1 });

  if (timeSlotType === 'common-event') {
    return {
      id: nanoid(),
      startTime: startTime.toISO({ suppressMilliseconds: true }),
      endTime: endTime.toISO({ suppressMilliseconds: true }),
      type: 'common-event',
      summary: t('sessionGrid.timeSlot.commonEvent.newName', 'Break'),
      icon: 'coffee',
    };
  } else {
    return {
      id: nanoid(),
      type: 'sessions',
      startTime: startTime.toISO({ suppressMilliseconds: true }),
      endTime: endTime.toISO({ suppressMilliseconds: true }),
    };
  }
}

/**
 * Perform a mutation of the session grid event.
 *
 * @param api - the `api` that is provided in `queryFn(_, api)`.
 * @param recipe - the recipe to update the session grid.
 *                 Exceptions can be thrown and will be converted to redux-errors.
 * @returns the result of the update or an error if failed
 */
export async function updateSessionGrid(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: { dispatch: ThunkDispatch<any, any, AnyAction> } & Pick<
    BaseQueryApi,
    'extra'
  >,
  recipe: Recipe<SessionGridEvent>
): Promise<
  QueryReturnValue<{ event: StateEvent<SessionGridEvent> }, BaseApiError>
> {
  const { dispatch, extra } = api;
  const { widgetApi } = extra as ThunkExtraArgument;

  let undo = () => {};
  try {
    const { event } = await dispatch(
      sessionGridApi.endpoints.getSessionGrid.initiate()
    ).unwrap();

    if (!event) {
      return {
        error: { name: 'UpdateFailed', message: 'No session grid found' },
      };
    }

    const nextContent = produce(event.content, recipe);

    // eagerly update the local state
    ({ undo } = dispatch(
      sessionGridApi.util.updateQueryData(
        'getSessionGrid',
        undefined,
        (draft) => {
          if (draft.event) {
            draft.event.content = nextContent;
          }
        }
      )
    ));

    const newEvent = await widgetApi.sendStateEvent(
      STATE_EVENT_BARCAMP_SESSION_GRID,
      nextContent,
      { roomId: event.room_id, stateKey: event.state_key }
    );

    return { data: { event: newEvent } };
  } catch (e) {
    // restore the eager update on failure
    undo();

    const error = e as Error;
    return { error: { name: 'UpdateFailed', message: error.message } };
  }
}

export const {
  useGetSessionGridQuery,
  useAddTrackMutation,
  useUpdateTrackMutation,
  useDeleteTrackMutation,
  useAddTimeSlotMutation,
  useUpdateCommonEventMutation,
  useUpdateTimeSlotMutation,
  useDeleteTopicMutation,
  useSelectNextTopicMutation,
  useMoveTopicToSessionMutation,
  useMoveTopicToParkingAreaMutation,
  useMoveTimeSlotMutation,
  useDeleteTimeSlotMutation,
  useSetupSessionGridMutation,
} = sessionGridApi;
