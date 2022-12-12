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
import { mockInitializeSpaceParent, mockTopic } from '../../lib/testUtils';
import { createStore } from '../store';
import { topicApi } from './topicApi';
let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getTopic', () => {
  it('should return topic', async () => {
    mockInitializeSpaceParent(widgetApi);

    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(topicApi.endpoints.getTopic.initiate({ topicId: '$topic-1' }))
        .unwrap()
    ).resolves.toEqual({ topic });
  });

  it('should handle missing topic', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(topicApi.endpoints.getTopic.initiate({ topicId: '$topic-1' }))
        .unwrap()
    ).rejects.toEqual({
      name: 'LoadFailed',
      message: 'Could not load topic $topic-1',
    });
  });

  it('should observe topic', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    store.dispatch(
      topicApi.endpoints.getTopic.initiate({ topicId: '$topic-1' })
    );

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopic.select({ topicId: '$topic-1' })(
          store.getState()
        ).error
      ).toEqual({
        name: 'LoadFailed',
        message: 'Could not load topic $topic-1',
      })
    );

    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopic.select({ topicId: '$topic-1' })(
          store.getState()
        ).data
      ).toEqual({ topic })
    );
  });

  it('should observe topic when space changes', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(
      topicApi.endpoints.getTopic.initiate({ topicId: '$topic-1' })
    );

    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopic.select({ topicId: '$topic-1' })(
          store.getState()
        ).error
      ).toEqual({
        name: 'LoadFailed',
        message: expect.stringMatching(/could not load topic/i),
      })
    );

    mockInitializeSpaceParent(widgetApi);

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopic.select({ topicId: '$topic-1' })(
          store.getState()
        ).data
      ).toEqual({ topic })
    );
  });
});

describe('getTopics', () => {
  it('should return topics', async () => {
    mockInitializeSpaceParent(widgetApi);

    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(topicApi.endpoints.getTopics.initiate()).unwrap()
    ).resolves.toEqual({
      entities: {
        [topic.state_key]: topic,
      },
      ids: [topic.state_key],
    });
  });

  it('should observe topics', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    store.dispatch(topicApi.endpoints.getTopics.initiate());

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopics.select()(store.getState()).data
      ).toMatchObject({ entities: {}, ids: [] })
    );

    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopics.select()(store.getState()).data
      ).toMatchObject({
        entities: {
          [topic.state_key]: topic,
        },
        ids: [topic.state_key],
      })
    );
  });

  it('should observe space room changes', async () => {
    const topic1 = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );
    const topic2 = widgetApi.mockSendStateEvent(
      mockTopic({ room_id: '!another-space', state_key: '$topic-2' })
    );

    const store = createStore({ widgetApi });

    store.dispatch(topicApi.endpoints.getTopics.initiate());

    // Start without space
    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopics.select()(store.getState()).error
      ).toEqual({
        name: 'LoadFailed',
        message: expect.stringMatching(/could not load topics/i),
      })
    );

    // Start in one room
    mockInitializeSpaceParent(widgetApi);
    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopics.select()(store.getState()).data
      ).toEqual({
        entities: {
          [topic1.state_key]: topic1,
        },
        ids: [topic1.state_key],
      })
    );

    // Another canonical space is found
    mockInitializeSpaceParent(widgetApi, {
      spaceRoomId: '!another-space',
    });
    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopics.select()(store.getState()).data
      ).toEqual({
        entities: {
          [topic2.state_key]: topic2,
        },
        ids: [topic2.state_key],
      })
    );
  });
});

describe('createTopic', () => {
  it('should create topic state event', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          topicApi.endpoints.createTopic.initiate({
            id: '$topic-1',
            content: {
              title: 'My Topic',
              description: 'My Description',
              authors: [{ id: '@user-1' }],
            },
          })
        )
        .unwrap()
    ).resolves.toMatchObject({
      event: {
        type: 'net.nordeck.barcamp.topic',
        state_key: '$topic-1',
        room_id: '!space-id',
        content: {
          title: 'My Topic',
          description: 'My Description',
          authors: [{ id: '@user-1' }],
        },
      },
    });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.topic',
      {
        title: 'My Topic',
        description: 'My Description',
        authors: [{ id: '@user-1' }],
      },
      { stateKey: '$topic-1', roomId: '!space-id' }
    );
  });

  it('should skip topic that already exists', async () => {
    mockInitializeSpaceParent(widgetApi);
    const event = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          topicApi.endpoints.createTopic.initiate({
            id: '$topic-1',
            content: {
              title: 'My Topic',
              description: 'My Description',
              authors: [{ id: '@user-1' }],
            },
          })
        )
        .unwrap()
    ).resolves.toEqual({ event });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('updateTopic', () => {
  it('should update the title and description of a topic', async () => {
    mockInitializeSpaceParent(widgetApi);
    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          topicApi.endpoints.updateTopic.initiate({
            topicId: topic.state_key,
            changes: {
              title: 'Another title',
              description: 'Another Description',
            },
          })
        )
        .unwrap()
    ).resolves.toMatchObject({
      event: {
        type: 'net.nordeck.barcamp.topic',
        state_key: topic.state_key,
        room_id: topic.room_id,
        content: {
          title: 'Another title',
          description: 'Another Description',
          authors: topic.content.authors,
        },
      },
    });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.topic',
      {
        title: 'Another title',
        description: 'Another Description',
        authors: topic.content.authors,
      },
      { stateKey: '$topic-1', roomId: '!space-id' }
    );
  });

  it('should handle missing topic', async () => {
    mockInitializeSpaceParent(widgetApi);
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          topicApi.endpoints.updateTopic.initiate({
            topicId: 'some-topic',
            changes: {
              title: 'Another title',
              description: 'Another Description',
            },
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not update topic: Could not load topic some-topic',
    });
  });

  it('should eagerly update the store', async () => {
    mockInitializeSpaceParent(widgetApi);
    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );
    widgetApi.sendStateEvent.mockResolvedValue(topic);

    const store = createStore({ widgetApi });

    // pre populate the state
    await store.dispatch(topicApi.endpoints.getTopics.initiate()).unwrap();

    await expect(
      store
        .dispatch(
          topicApi.endpoints.updateTopic.initiate({
            topicId: topic.state_key,
            changes: {
              title: 'Another title',
            },
          })
        )
        .unwrap()
    ).resolves.toMatchObject({ event: topic });

    expect(
      topicApi.endpoints.getTopic.select({ topicId: '$topic-1' })(
        store.getState()
      )
    ).toEqual(
      expect.objectContaining({
        data: {
          topic: {
            ...topic,
            content: {
              ...topic.content,
              title: 'Another title',
            },
          },
        },
      })
    );
  });

  it('should restore the eager update on errors', async () => {
    mockInitializeSpaceParent(widgetApi);
    const topic = widgetApi.mockSendStateEvent(
      mockTopic({ state_key: '$topic-1' })
    );
    widgetApi.sendStateEvent.mockRejectedValue(new Error('an error'));

    const store = createStore({ widgetApi });

    // pre populate the state
    await store.dispatch(topicApi.endpoints.getTopics.initiate()).unwrap();

    await expect(
      store
        .dispatch(
          topicApi.endpoints.updateTopic.initiate({
            topicId: topic.state_key,
            changes: {
              title: 'Another title',
            },
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Could not update topic: Error: an error',
    });

    await waitFor(() =>
      expect(
        topicApi.endpoints.getTopic.select({ topicId: '$topic-1' })(
          store.getState()
        )
      ).toEqual(expect.objectContaining({ data: { topic } }))
    );
  });
});
