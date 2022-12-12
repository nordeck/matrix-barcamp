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
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { isPlainObject } from 'lodash';
import { Symbols } from 'matrix-widget-api';
import { bufferTime, filter } from 'rxjs';
import { TopicChanges } from '../../components/StickyNote';
import {
  isValidTopicEvent,
  STATE_EVENT_BARCAMP_TOPIC,
  TopicEvent,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';
import { spaceApi } from './spaceApi';

const topicEventEntityAdapter = createEntityAdapter<StateEvent<TopicEvent>>({
  selectId: (event) => event.state_key,
});

type GetTopicsResult = EntityState<StateEvent<TopicEvent>>;
type GetTopicResult = { topic: StateEvent<TopicEvent> };

/**
 * All endpoints that concern the topic events that should
 * be displayed in the grid.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const topicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Internal endpoint to hold a cache of all topics in the space room.
     * Consumers should use the `getTopic({topicId: string})` endpoint to
     * consume these information.
     */
    getTopics: builder.query<GetTopicsResult, void>({
      providesTags: () => ['SpaceRoom'],

      async queryFn(_, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        const initialState = topicEventEntityAdapter.getInitialState();

        try {
          const { spaceId } = await dispatch(
            spaceApi.endpoints.getSpaceRoom.initiate()
          ).unwrap();

          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_BARCAMP_TOPIC,
            { roomIds: [spaceId] }
          );

          return {
            data: topicEventEntityAdapter.addMany(
              initialState,
              events.filter(isValidTopicEvent)
            ),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load topics: ${
                hasMessage(e) ? e.message : e
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
          getState,
        }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const spaceRoomSubscription = dispatch(
          spaceApi.endpoints.getSpaceRoom.initiate()
        );

        const subscription = widgetApi
          .observeStateEvents(STATE_EVENT_BARCAMP_TOPIC, {
            roomIds: Symbols.AnyRoom,
          })
          .pipe(
            filter(isValidTopicEvent),
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
                topicEventEntityAdapter.upsertMany(state, changeEvents)
              );

              // invalidate all updated topics
              const state = getState();
              const changedTopicEvents = changeEvents.filter((e) => {
                const cachedTopic = topicApi.endpoints.getTopic.select({
                  topicId: e.state_key,
                })(state)?.data?.topic;
                return cachedTopic?.event_id !== e.event_id;
              });
              dispatch(
                topicApi.util.invalidateTags(
                  changedTopicEvents.map((e) => ({
                    type: 'Topic',
                    id: e.state_key,
                  }))
                )
              );
            }
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
        spaceRoomSubscription.unsubscribe();
      },
    }),

    getTopic: builder.query<GetTopicResult, { topicId: string }>({
      providesTags: (_, __, { topicId }) => [{ type: 'Topic', id: topicId }],

      async queryFn({ topicId }, { dispatch }) {
        try {
          const state = await dispatch(
            topicApi.endpoints.getTopics.initiate()
          ).unwrap();

          const topic = selectTopicById(state, topicId);

          if (!topic) {
            return {
              error: {
                name: 'LoadFailed',
                message: `Could not load topic ${topicId}`,
              },
            };
          }

          return { data: { topic } };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load topic: ${hasMessage(e) ? e.message : e}`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, dispatch }
      ) {
        // wait until first data is cached
        await cacheDataLoaded;

        // make sure the `getTopics` endpoint keeps updating
        const subscription = dispatch(topicApi.endpoints.getTopics.initiate());

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    createTopic: builder.mutation<
      { event: StateEvent<TopicEvent> },
      { id: string; content: TopicEvent }
    >({
      async queryFn({ id, content }, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const { spaceId } = await dispatch(
            spaceApi.endpoints.getSpaceRoom.initiate()
          ).unwrap();

          // don't override a topic that already exists.
          const topicsData = await dispatch(
            topicApi.endpoints.getTopics.initiate()
          ).unwrap();

          const existingTopic = selectTopicById(topicsData, id);

          if (existingTopic) {
            return {
              data: { event: existingTopic },
            };
          }

          const event = await widgetApi.sendStateEvent(
            STATE_EVENT_BARCAMP_TOPIC,
            content,
            { roomId: spaceId, stateKey: id }
          );

          dispatch(
            topicApi.util.updateQueryData('getTopics', undefined, (draft) => {
              topicEventEntityAdapter.upsertOne(draft, event);
            })
          );

          return { data: { event } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not create topic: ${
                hasMessage(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),

    updateTopic: builder.mutation<
      { event: StateEvent<TopicEvent> },
      { topicId: string; changes: TopicChanges }
    >({
      async onQueryStarted({ topicId, changes }, { dispatch, queryFulfilled }) {
        // eagerly update the local state
        const change = dispatch(
          topicApi.util.updateQueryData('getTopics', undefined, (draft) => {
            const topic = topicEventEntityAdapter
              .getSelectors()
              ?.selectById(draft, topicId);

            if (topic) {
              topicEventEntityAdapter.updateOne(draft, {
                id: topicId,
                changes: {
                  content: {
                    ...topic?.content,
                    ...changes,
                  },
                },
              });
            }
          })
        );
        dispatch(
          topicApi.util.invalidateTags([{ type: 'Topic', id: topicId }])
        );

        try {
          await queryFulfilled;
        } catch {
          change.undo();
          dispatch(
            topicApi.util.invalidateTags([{ type: 'Topic', id: topicId }])
          );
        }
      },

      async queryFn({ topicId, changes }, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          // Cast to break the circular type dependency
          const { topic } = (await dispatch(
            topicApi.endpoints.getTopic.initiate({ topicId })
          ).unwrap()) as GetTopicResult;

          const newEvent = await widgetApi.sendStateEvent(
            STATE_EVENT_BARCAMP_TOPIC,
            { ...topic.content, ...changes },
            { roomId: topic.room_id, stateKey: topic.state_key }
          );

          return { data: { event: newEvent } };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update topic: ${
                hasMessage(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

const { selectById: selectTopicById } = topicEventEntityAdapter.getSelectors();

export const { useGetTopicQuery, useUpdateTopicMutation } = topicApi;

function hasMessage(input: unknown): input is { message: string } {
  return (
    isPlainObject(input) &&
    typeof (input as { message?: string }).message === 'string'
  );
}
