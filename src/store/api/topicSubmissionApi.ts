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

import { compareOriginServerTS, RoomEvent } from '@matrix-widget-toolkit/api';
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { isError } from 'lodash';
import { bufferTime, filter } from 'rxjs';
import {
  isValidTopicSubmissionEvent,
  ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
  TopicSubmissionEvent,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';
import { sessionGridApi } from './sessionGridApi';

const topicSubmissionEventEntityAdapter = createEntityAdapter({
  selectId: (event: RoomEvent<TopicSubmissionEvent>) => event.event_id,
  sortComparer: compareOriginServerTS,
});

/**
 * All endpoints that concern the topic submission events that should
 * be displayed in the grid.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const topicSubmissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTopicSubmissions: builder.query<
      EntityState<RoomEvent<TopicSubmissionEvent>, string>,
      void
    >({
      async queryFn(_, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        const initialState =
          topicSubmissionEventEntityAdapter.getInitialState();

        try {
          const { event: sessionGrid } = await dispatch(
            sessionGridApi.endpoints.getSessionGrid.initiate()
          ).unwrap();

          let submissions: RoomEvent<TopicSubmissionEvent>[] = [];

          if (sessionGrid?.content.topicStartEventId) {
            let from: string | undefined = undefined;
            do {
              const result = await widgetApi.readEventRelations(
                sessionGrid.content.topicStartEventId,
                {
                  limit: 50,
                  from,
                  relationType: 'm.reference',
                  eventType: ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
                }
              );

              submissions.push(
                ...result.chunk.filter(isValidTopicSubmissionEvent)
              );

              // typescript doesn't like circular types
              from = result.nextToken as string | undefined;
            } while (from !== undefined);
          } else {
            const events = await widgetApi.receiveRoomEvents(
              ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
            );

            submissions = events.filter(isValidTopicSubmissionEvent);
          }

          return {
            data: topicSubmissionEventEntityAdapter.addMany(
              initialState,
              submissions
            ),
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load topic submissions: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },

      async onCacheEntryAdded(
        _,
        { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData }
      ) {
        const { widgetApi } = extra as ThunkExtraArgument;

        // wait until first data is cached
        await cacheDataLoaded;

        const subscription = widgetApi
          .observeRoomEvents(ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION)
          .pipe(
            filter(isValidTopicSubmissionEvent),
            bufferTime(0),
            filter((list) => list.length > 0)
          )
          .subscribe(async (events) => {
            updateCachedData((state) =>
              topicSubmissionEventEntityAdapter.upsertMany(state, events ?? [])
            );
          });

        // wait until subscription is cancelled
        await cacheEntryRemoved;

        subscription.unsubscribe();
      },
    }),

    createTopicSubmission: builder.mutation<
      RoomEvent<TopicSubmissionEvent>,
      Omit<TopicSubmissionEvent, 'm.relates_to'>
    >({
      async queryFn(content, { extra, dispatch }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const { event: sessionGrid } = await dispatch(
            sessionGridApi.endpoints.getSessionGrid.initiate()
          ).unwrap();

          const data = await widgetApi.sendRoomEvent<TopicSubmissionEvent>(
            ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
            {
              ...content,
              ...(sessionGrid?.content.topicStartEventId && {
                'm.relates_to': {
                  rel_type: 'm.reference',
                  event_id: sessionGrid.content.topicStartEventId,
                },
              }),
            }
          );

          return { data };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not create topic submission: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

const { selectAll: selectSubmittedTopics } =
  topicSubmissionEventEntityAdapter.getSelectors();

export function selectAvailableSubmittedTopics(
  state: EntityState<RoomEvent<TopicSubmissionEvent>, string>,
  consumedTopicSubmissions: string[]
): RoomEvent<TopicSubmissionEvent>[] {
  return selectSubmittedTopics(state).filter(
    (event) => !consumedTopicSubmissions.includes(event.event_id)
  );
}

export const { useCreateTopicSubmissionMutation, useGetTopicSubmissionsQuery } =
  topicSubmissionApi;
