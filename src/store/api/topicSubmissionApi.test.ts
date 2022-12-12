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
import { mockTopicSubmission } from '../../lib/testUtils';
import { createStore } from '../store';
import {
  selectAvailableSubmittedTopics,
  topicSubmissionApi,
} from './topicSubmissionApi';

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getTopicSubmissions', () => {
  it('should return topic submissions', async () => {
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        event_id: '$event-1',
        origin_server_ts: 2,
        content: {
          title: 'My second topic',
        },
      })
    );
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        event_id: '$event-0',
        origin_server_ts: 1,
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(topicSubmissionApi.endpoints.getTopicSubmissions.initiate())
        .unwrap()
    ).resolves.toEqual({
      ids: ['$event-0', '$event-1'],
      entities: {
        '$event-0': expect.objectContaining({
          content: {
            description: 'I would like to talk about…',
            title: 'My topic',
          },
        }),
        '$event-1': expect.objectContaining({
          content: {
            description: 'I would like to talk about…',
            title: 'My second topic',
          },
        }),
      },
    });
  });

  it('should observe topic submissions', async () => {
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        event_id: '$event-1',
        origin_server_ts: 2,
        content: {
          title: 'My second topic',
        },
      })
    );

    const store = createStore({ widgetApi });

    store.dispatch(topicSubmissionApi.endpoints.getTopicSubmissions.initiate());

    await waitFor(() =>
      expect(
        topicSubmissionApi.endpoints.getTopicSubmissions.select()(
          store.getState()
        ).data
      ).toEqual(expect.objectContaining({ ids: ['$event-1'] }))
    );

    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        event_id: '$event-0',
        origin_server_ts: 1,
      })
    );

    await waitFor(() =>
      expect(
        topicSubmissionApi.endpoints.getTopicSubmissions.select()(
          store.getState()
        ).data
      ).toEqual(expect.objectContaining({ ids: ['$event-0', '$event-1'] }))
    );
  });
});

describe('createTopicSubmission', () => {
  it('should create a topic submissions', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          topicSubmissionApi.endpoints.createTopicSubmission.initiate({
            title: 'My new topic',
            description: 'Hello World',
          })
        )
        .unwrap()
    ).resolves.toEqual(
      expect.objectContaining({
        content: {
          description: 'Hello World',
          title: 'My new topic',
        },
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic_submission',
      })
    );

    expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.barcamp.topic_submission',
      {
        description: 'Hello World',
        title: 'My new topic',
      }
    );
  });
});

describe('selectAvailableSubmittedTopics', () => {
  it('should select all non-consumed topic submissions', () => {
    expect(
      selectAvailableSubmittedTopics(
        {
          entities: {
            '$event-0': mockTopicSubmission({
              event_id: '$event-0',
            }),
            '$event-1': mockTopicSubmission({
              event_id: '$event-1',
            }),
          },
          ids: ['$event-0', '$event-1'],
        },
        ['$event-0']
      )
    ).toEqual([
      mockTopicSubmission({
        event_id: '$event-1',
      }),
    ]);
  });
});
