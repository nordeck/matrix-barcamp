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
import {
  mockInitializeSpaceParent,
  mockSessionGrid,
  mockSessionGridStart,
  mockTopic,
  mockTopicSubmission,
} from '../../lib/testUtils';
import { createStore } from '../store';
import { sessionGridApi, updateSessionGrid } from './sessionGridApi';

let widgetApi: MockedWidgetApi;

afterEach(() => {
  widgetApi.stop();
  jest.useRealTimers();
});

beforeEach(() => (widgetApi = mockWidgetApi()));

describe('getSessionGrid', () => {
  it('should return session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    const sessionGrid = widgetApi.mockSendStateEvent(mockSessionGrid());

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(sessionGridApi.endpoints.getSessionGrid.initiate())
        .unwrap()
    ).resolves.toEqual({ event: sessionGrid });
  });

  it.skip('should handle missing session grid if not in a space', async () => {
    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(sessionGridApi.endpoints.getSessionGrid.initiate())
        .unwrap()
    ).resolves.toEqual({ error: 'NoSpace' });
  });

  it('should handle missing session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(sessionGridApi.endpoints.getSessionGrid.initiate())
        .unwrap()
    ).resolves.toEqual({ error: 'NoSessionGrid' });
  });

  it('should observe session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    store.dispatch(sessionGridApi.endpoints.getSessionGrid.initiate());

    await waitFor(() => {
      expect(
        sessionGridApi.endpoints.getSessionGrid.select()(store.getState()).data
      ).toEqual({ error: 'NoSessionGrid' });
    });

    const sessionGrid0 = widgetApi.mockSendStateEvent(mockSessionGrid());

    await waitFor(() => {
      expect(
        sessionGridApi.endpoints.getSessionGrid.select()(store.getState()).data
      ).toEqual({ event: sessionGrid0 });
    });

    const sessionGrid1 = widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Nilpferd',
              icon: 'hippo',
            },
          ],
        },
      })
    );

    await waitFor(() => {
      expect(
        sessionGridApi.endpoints.getSessionGrid.select()(store.getState()).data
      ).toEqual({ event: sessionGrid1 });
    });
  });

  it.skip('should observe session grid when space changes', async () => {
    const store = createStore({ widgetApi });

    store.dispatch(sessionGridApi.endpoints.getSessionGrid.initiate());

    const sessionGrid = widgetApi.mockSendStateEvent(mockSessionGrid());

    await waitFor(() => {
      expect(
        sessionGridApi.endpoints.getSessionGrid.select()(store.getState()).data
      ).toEqual({ error: 'NoSpace' });
    });

    mockInitializeSpaceParent(widgetApi);

    await waitFor(() => {
      expect(
        sessionGridApi.endpoints.getSessionGrid.select()(store.getState()).data
      ).toEqual({ event: sessionGrid });
    });
  });
});

describe('setupSessionGrid', () => {
  it('should setup session grid', async () => {
    const date = new Date('2022-04-14');
    jest.useFakeTimers();
    jest.setSystemTime(date);

    mockInitializeSpaceParent(widgetApi);

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(sessionGridApi.endpoints.setupSessionGrid.initiate())
        .unwrap()
    ).resolves.toMatchObject({ event: expect.any(Object) });

    expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid.start',
      {}
    );

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      {
        consumedTopicSubmissions: [],
        parkingLot: [],
        sessions: [],
        timeSlots: [
          {
            id: expect.any(String),
            type: 'sessions',
            startTime: '2022-04-14T10:00:00Z',
            endTime: '2022-04-14T11:00:00Z',
          },
        ],
        tracks: [
          {
            icon: expect.any(String),
            id: expect.any(String),
            name: 'Track 1',
          },
        ],
        topicStartEventId: expect.any(String),
      },
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('selectNextTopic', () => {
  it('should select next topic and add it to the parking lot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendRoomEvent(mockSessionGridStart());

    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Title 1',
          description: 'Description 1',
        },
        origin_server_ts: 1,
        event_id: '$event-1',
        sender: '@author-1',
      })
    );
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Title 2',
          description: 'Description 2',
        },
        origin_server_ts: 2,
        event_id: '$event-2',
        sender: '@author-2',
      })
    );

    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: '$event-0',
        content: {
          title: 'Title 0',
          description: 'Description 0',
          authors: [{ id: '@author-0' }],
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          parkingLot: [{ topicId: '$event-0' }],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(sessionGridApi.endpoints.selectNextTopic.initiate())
        .unwrap()
    ).resolves.toMatchObject({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(2);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.topic',
      {
        description: 'Description 1',
        title: 'Title 1',
        authors: [{ id: '@author-1' }],
      },
      { roomId: '!room-id', stateKey: '$event-1' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      mockSessionGrid({
        content: {
          consumedTopicSubmissions: ['$event-1'],
          parkingLot: [{ topicId: '$event-1' }, { topicId: '$event-0' }],
        },
      }).content,
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should handle empty submission queue', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendRoomEvent(mockSessionGridStart());

    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        event_id: '$event-1',
      })
    );

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          consumedTopicSubmissions: ['$event-1'],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(sessionGridApi.endpoints.selectNextTopic.initiate())
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'No next topic submission',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('moveTopicToParkingArea', () => {
  it('should move topic inside parking lot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-0',
        content: {
          title: 'Title 1',
          description: 'Description 1',
          authors: [{ id: '@author-1' }],
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-1',
        content: {
          title: 'Title 2',
          description: 'Description 2',
          authors: [{ id: '@author-2' }],
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-2',
        content: {
          title: 'Title 3',
          description: 'Description 3',
          authors: [{ id: '@author-3' }],
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          parkingLot: [
            { topicId: 'id-0' },
            { topicId: 'id-1' },
            { topicId: 'id-2' },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTopicToParkingArea.initiate({
            topicId: 'id-0',
            toIndex: 2,
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      mockSessionGrid({
        content: {
          parkingLot: [
            { topicId: 'id-1' },
            { topicId: 'id-2' },
            { topicId: 'id-0' },
          ],
        },
      }).content,
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should move topic from session grid to parking lot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-0',
        content: {
          title: 'Title 1',
          description: 'Description 1',
          authors: [{ id: '@author-1' }],
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-1',
        content: {
          title: 'Title 2',
          description: 'Description 2',
          authors: [{ id: '@author-2' }],
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          parkingLot: [{ topicId: 'id-0' }],
          sessions: [
            {
              topicId: 'id-1',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTopicToParkingArea.initiate({
            topicId: 'id-1',
            toIndex: 1,
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      mockSessionGrid({
        content: {
          parkingLot: [{ topicId: 'id-0' }, { topicId: 'id-1' }],
          sessions: [],
        },
      }).content,
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('moveTopicToSession', () => {
  it('should move topic inside session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-0',
        content: {
          title: 'Title 1',
          description: 'Description 1',
          authors: [{ id: '@author-1' }],
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'id-1',
        content: {
          title: 'Title 2',
          description: 'Description 2',
          authors: [{ id: '@author-2' }],
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
            {
              id: 'track-1',
              name: 'Room 1',
              icon: 'my-icon',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeslot-2',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T12:00:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'id-0',
              trackId: 'track-1',
              timeSlotId: 'timeslot-1',
            },
            {
              topicId: 'id-1',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTopicToSession.initiate({
            topicId: 'id-0',
            trackId: 'track-1',
            timeSlotId: 'timeslot-2',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        sessions: [
          {
            topicId: 'id-1',
            trackId: 'track-0',
            timeSlotId: 'timeslot-1',
          },
          {
            topicId: 'id-0',
            trackId: 'track-1',
            timeSlotId: 'timeslot-2',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should move topic from parking lot to session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
            {
              id: 'track-1',
              name: 'Room 1',
              icon: 'my-icon',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeslot-2',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T12:00:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'id-1',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
          parkingLot: [{ topicId: 'id-0' }],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTopicToSession.initiate({
            topicId: 'id-0',
            trackId: 'track-1',
            timeSlotId: 'timeslot-1',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        sessions: [
          {
            topicId: 'id-1',
            trackId: 'track-0',
            timeSlotId: 'timeslot-1',
          },
          {
            topicId: 'id-0',
            trackId: 'track-1',
            timeSlotId: 'timeslot-1',
          },
        ],
        parkingLot: [],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should fail to move topic onto an already occupied session in session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'id-1',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
          parkingLot: [{ topicId: 'id-0' }],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTopicToSession.initiate({
            topicId: 'id-0',
            trackId: 'track-0',
            timeSlotId: 'timeslot-1',
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: expect.stringMatching(/Session already in use/),
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('updateTimeSlot', () => {
  it('should update the duration of a time slot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'ts0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T01:00:00Z',
            },
            {
              id: 'ts1',
              type: 'sessions',
              startTime: '2020-01-01T02:00:00Z',
              endTime: '2020-01-01T02:30:00Z',
            },
            {
              id: 'ts3',
              type: 'sessions',
              startTime: '2020-01-01T02:30:00Z',
              endTime: '2020-01-01T04:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateTimeSlot.initiate({
            timeSlotId: 'ts1',
            changes: {
              durationMinutes: 25,
            },
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'ts0',
            type: 'sessions',
            startTime: '2020-01-01T00:00:00Z',
            endTime: '2020-01-01T01:00:00Z',
          },
          {
            id: 'ts1',
            type: 'sessions',
            startTime: '2020-01-01T01:00:00Z',
            endTime: '2020-01-01T01:25:00Z',
          },
          {
            id: 'ts3',
            type: 'sessions',
            startTime: '2020-01-01T01:25:00Z',
            endTime: '2020-01-01T02:55:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should update the start time of the first time slot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'ts0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T01:00:00Z',
            },
            {
              id: 'ts1',
              type: 'sessions',
              startTime: '2020-01-01T01:00:00Z',
              endTime: '2020-01-01T01:30:00Z',
            },
            {
              id: 'ts3',
              type: 'sessions',
              startTime: '2020-01-01T01:30:00Z',
              endTime: '2020-01-01T03:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateTimeSlot.initiate({
            timeSlotId: 'ts0',
            changes: {
              startTime: '2022-05-03T17:00:00Z',
            },
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'ts0',
            type: 'sessions',
            startTime: '2022-05-03T17:00:00Z',
            endTime: '2022-05-03T18:00:00Z',
          },
          {
            id: 'ts1',
            type: 'sessions',
            startTime: '2022-05-03T18:00:00Z',
            endTime: '2022-05-03T18:30:00Z',
          },
          {
            id: 'ts3',
            type: 'sessions',
            startTime: '2022-05-03T18:30:00Z',
            endTime: '2022-05-03T20:00:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('rejects update of the second timeslot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'ts0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T01:00:00Z',
            },
            {
              id: 'ts1',
              type: 'sessions',
              startTime: '2020-01-01T01:00:00Z',
              endTime: '2020-01-01T01:30:00Z',
            },
            {
              id: 'ts3',
              type: 'sessions',
              startTime: '2020-01-01T01:30:00Z',
              endTime: '2020-01-01T03:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateTimeSlot.initiate({
            timeSlotId: 'ts1',
            changes: {
              startTime: '2022-05-03T17:00:00Z',
            },
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Only start time of first timeslot can be changed.',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('rejects update of timeslot when date is cleared', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'ts0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T01:00:00Z',
            },
            {
              id: 'ts1',
              type: 'sessions',
              startTime: '2020-01-01T01:00:00Z',
              endTime: '2020-01-01T01:30:00Z',
            },
            {
              id: 'ts3',
              type: 'sessions',
              startTime: '2020-01-01T01:30:00Z',
              endTime: '2020-01-01T03:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateTimeSlot.initiate({
            timeSlotId: 'ts1',
            changes: {
              startTime: 'null',
            },
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Only start time of first timeslot can be changed.',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('rejects update of timeslot when wrong time was added', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'ts0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T01:00:00Z',
            },
            {
              id: 'ts1',
              type: 'sessions',
              startTime: '2020-01-01T01:00:00Z',
              endTime: '2020-01-01T01:30:00Z',
            },
            {
              id: 'ts3',
              type: 'sessions',
              startTime: '2020-01-01T01:30:00Z',
              endTime: '2020-01-01T03:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateTimeSlot.initiate({
            timeSlotId: 'ts1',
            changes: {
              startTime: '2022-05-03T17:71:00Z',
            },
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Only start time of first timeslot can be changed.',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('updateCommonEvent', () => {
  it('should update summary of common event', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T12:00:00Z',
            },
            {
              id: 'timeslot-1',
              type: 'common-event',
              startTime: '2022-02-28T12:00:00Z',
              endTime: '2022-02-28T13:15:00Z',
              icon: 'coffee',
              summary: 'Break',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateCommonEvent.initiate({
            timeSlotId: 'timeslot-1',
            changes: {
              summary: 'Coffee Break',
            },
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'timeslot-0',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T12:00:00Z',
          },
          {
            id: 'timeslot-1',
            type: 'common-event',
            startTime: '2022-02-28T12:00:00Z',
            endTime: '2022-02-28T13:15:00Z',
            icon: 'coffee',
            summary: 'Coffee Break',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('updateTrack', () => {
  it('should update the name of a track', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'hippo',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.updateTrack.initiate({
            trackId: 'track-0',
            changes: {
              name: 'Room 0 (updated)',
            },
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        tracks: [
          {
            id: 'track-0',
            name: 'Room 0 (updated)',
            icon: 'hippo',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('addTrack', () => {
  it('should add a track', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'room-0',
              name: 'Room 0',
              icon: 'hippo',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store.dispatch(sessionGridApi.endpoints.addTrack.initiate()).unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        tracks: [
          {
            id: 'room-0',
            name: 'Room 0',
            icon: 'hippo',
          },
          {
            id: expect.any(String),
            name: 'Track 2',
            icon: expect.any(String),
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('deleteTrack', () => {
  it('should delete a track and move its topics to the parking lot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
            {
              id: 'track-1',
              name: 'Room 1',
              icon: 'my-icon',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'id-1',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
          parkingLot: [{ topicId: 'id-0' }],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTrack.initiate({ trackId: 'track-0' })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        tracks: [
          {
            id: 'track-1',
            name: 'Room 1',
            icon: 'my-icon',
          },
        ],
        timeSlots: [
          {
            id: 'timeslot-1',
            type: 'sessions',
            startTime: '2022-02-28T09:30:00Z',
            endTime: '2022-02-28T10:30:00Z',
          },
        ],
        sessions: [],
        parkingLot: [{ topicId: 'id-1' }, { topicId: 'id-0' }],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should prevent the last track from being deleted', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTrack.initiate({ trackId: 'track-0' })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Can not delete last track',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('deleteTopic', () => {
  it('should delete topic from the session grid', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          sessions: [
            {
              topicId: 'id-1',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTopic.initiate({ topicId: 'id-1' })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        sessions: [],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should delete topic from the parking lot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          parkingLot: [{ topicId: 'id-0' }],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTopic.initiate({ topicId: 'id-0' })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        parkingLot: [],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('deleteTimeSlot', () => {
  it('should delete a time slot, move topics and adjust start/end times', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
          ],
          timeSlots: [
            {
              id: 'timeSlot-0',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeSlot-1',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T11:30:00Z',
            },
            {
              id: 'timeSlot-2',
              type: 'sessions',
              startTime: '2022-02-28T11:30:00Z',
              endTime: '2022-02-28T12:30:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'topic-0',
              trackId: 'track-0',
              timeSlotId: 'timeSlot-1',
            },
          ],
          parkingLot: [{ topicId: 'parking-lot-topic-0' }],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTimeSlot.initiate({
            timeSlotId: 'timeSlot-1',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        tracks: [
          {
            id: 'track-0',
            name: 'Room 0',
            icon: 'my-icon',
          },
        ],
        timeSlots: [
          {
            id: 'timeSlot-0',
            type: 'sessions',
            startTime: '2022-02-28T09:30:00Z',
            endTime: '2022-02-28T10:30:00Z',
          },
          {
            id: 'timeSlot-2',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T11:30:00Z',
          },
        ],
        sessions: [],
        parkingLot: [
          { topicId: 'topic-0' },
          { topicId: 'parking-lot-topic-0' },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should keep the pervious start time if the first time slot is deleted', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Room 0',
              icon: 'my-icon',
            },
          ],
          timeSlots: [
            {
              id: 'timeSlot-0',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeSlot-1',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T11:30:00Z',
            },
            {
              id: 'timeSlot-2',
              type: 'sessions',
              startTime: '2022-02-28T11:30:00Z',
              endTime: '2022-02-28T12:30:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTimeSlot.initiate({
            timeSlotId: 'timeSlot-0',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        tracks: [
          {
            id: 'track-0',
            name: 'Room 0',
            icon: 'my-icon',
          },
        ],
        timeSlots: [
          {
            id: 'timeSlot-1',
            type: 'sessions',
            startTime: '2022-02-28T09:30:00Z',
            endTime: '2022-02-28T10:30:00Z',
          },
          {
            id: 'timeSlot-2',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T11:30:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should prevent the last time slot from being deleted', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeSlot-0',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.deleteTimeSlot.initiate({
            timeSlotId: 'timeSlot-0',
          })
        )
        .unwrap()
    ).rejects.toEqual({
      name: 'UpdateFailed',
      message: 'Can not delete last time slot',
    });

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });
});

describe('addTimeSlot', () => {
  it('should add a new sessions time slot using the end time of the last time slot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T12:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.addTimeSlot.initiate({
            timeSlotType: 'sessions',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'timeslot-0',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T12:00:00Z',
          },
          {
            id: expect.any(String),
            type: 'sessions',
            startTime: '2022-02-28T12:00:00Z',
            endTime: '2022-02-28T13:00:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should start the first time slot at 10:00', async () => {
    const date = new Date('2022-02-28');
    jest.useFakeTimers();
    jest.setSystemTime(date);

    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.addTimeSlot.initiate({
            timeSlotType: 'sessions',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: expect.any(String),
            type: 'sessions',
            startTime: '2022-02-28T10:00:00Z',
            endTime: '2022-02-28T11:00:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should add a new common event time slot using the end time of the last time slot', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T12:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.addTimeSlot.initiate({
            timeSlotType: 'common-event',
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'timeslot-0',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T12:00:00Z',
          },
          {
            id: expect.any(String),
            startTime: '2022-02-28T12:00:00Z',
            endTime: '2022-02-28T13:00:00Z',
            type: 'common-event',
            summary: 'Break',
            icon: 'coffee',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('moveTimeSlot', () => {
  it('should move timeslot and recalculate all time slot times', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2022-02-28T09:00:00Z',
              endTime: '2022-02-28T09:30:00Z',
            },
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeslot-2',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T11:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTimeSlot.initiate({
            timeSlotId: 'timeslot-2',
            toIndex: 1,
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'timeslot-0',
            type: 'sessions',
            startTime: '2022-02-28T09:00:00Z',
            endTime: '2022-02-28T09:30:00Z',
          },
          {
            id: 'timeslot-2',
            type: 'sessions',
            startTime: '2022-02-28T09:30:00Z',
            endTime: '2022-02-28T10:00:00Z',
          },
          {
            id: 'timeslot-1',
            type: 'sessions',
            startTime: '2022-02-28T10:00:00Z',
            endTime: '2022-02-28T11:00:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should move timeslot to the start and keep the previous event start time', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2022-02-28T09:00:00Z',
              endTime: '2022-02-28T09:30:00Z',
            },
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeslot-2',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T11:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTimeSlot.initiate({
            timeSlotId: 'timeslot-1',
            toIndex: 0,
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'timeslot-1',
            type: 'sessions',
            startTime: '2022-02-28T09:00:00Z',
            endTime: '2022-02-28T10:00:00Z',
          },
          {
            id: 'timeslot-0',
            type: 'sessions',
            startTime: '2022-02-28T10:00:00Z',
            endTime: '2022-02-28T10:30:00Z',
          },
          {
            id: 'timeslot-2',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T11:00:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should move the start timeslot and keep the previous event start time', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2022-02-28T09:00:00Z',
              endTime: '2022-02-28T09:30:00Z',
            },
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T09:30:00Z',
              endTime: '2022-02-28T10:30:00Z',
            },
            {
              id: 'timeslot-2',
              type: 'sessions',
              startTime: '2022-02-28T10:30:00Z',
              endTime: '2022-02-28T11:00:00Z',
            },
          ],
        },
      })
    );

    const store = createStore({ widgetApi });

    await expect(
      store
        .dispatch(
          sessionGridApi.endpoints.moveTimeSlot.initiate({
            timeSlotId: 'timeslot-0',
            toIndex: 1,
          })
        )
        .unwrap()
    ).resolves.toEqual({ event: expect.any(Object) });

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      expect.objectContaining({
        timeSlots: [
          {
            id: 'timeslot-1',
            type: 'sessions',
            startTime: '2022-02-28T09:00:00Z',
            endTime: '2022-02-28T10:00:00Z',
          },
          {
            id: 'timeslot-0',
            type: 'sessions',
            startTime: '2022-02-28T10:00:00Z',
            endTime: '2022-02-28T10:30:00Z',
          },
          {
            id: 'timeslot-2',
            type: 'sessions',
            startTime: '2022-02-28T10:30:00Z',
            endTime: '2022-02-28T11:00:00Z',
          },
        ],
      }),
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });
});

describe('updateSessionGrid', () => {
  it('should update event', async () => {
    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(mockSessionGrid());

    const store = createStore({ widgetApi });

    await expect(
      updateSessionGrid(
        { dispatch: store.dispatch, extra: { widgetApi } },
        (draft) => {
          draft.sessions.push({
            trackId: 'track-0',
            timeSlotId: 'timeslot-0',
            topicId: 'topic-0',
          });
        }
      )
    ).resolves.toEqual({
      data: {
        event: expect.objectContaining({
          type: 'net.nordeck.barcamp.session_grid',
          content: {
            consumedTopicSubmissions: [],
            parkingLot: [],
            sessions: [
              {
                timeSlotId: 'timeslot-0',
                topicId: 'topic-0',
                trackId: 'track-0',
              },
            ],
            timeSlots: [],
            tracks: [],
            topicStartEventId: '$start-event-id',
          },
          room_id: '!room-id',
          sender: '@user-id',
          state_key: '!room-id',
        }),
      },
    });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(1);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      {
        consumedTopicSubmissions: [],
        parkingLot: [],
        sessions: [
          {
            timeSlotId: 'timeslot-0',
            topicId: 'topic-0',
            trackId: 'track-0',
          },
        ],
        timeSlots: [],
        tracks: [],
        topicStartEventId: '$start-event-id',
      },
      { roomId: '!room-id', stateKey: '!room-id' }
    );
  });

  it('should eagerly update the store', async () => {
    mockInitializeSpaceParent(widgetApi);

    const grid = widgetApi.mockSendStateEvent(mockSessionGrid());

    widgetApi.sendStateEvent.mockResolvedValue(grid);

    const store = createStore({ widgetApi });

    await expect(
      updateSessionGrid(
        { dispatch: store.dispatch, extra: { widgetApi } },
        (draft) => {
          draft.sessions.push({
            trackId: 'track-0',
            timeSlotId: 'timeslot-0',
            topicId: 'topic-0',
          });
        }
      )
    ).resolves.toEqual({ data: { event: grid } });

    expect(
      sessionGridApi.endpoints.getSessionGrid.select()(store.getState())
    ).toEqual(
      expect.objectContaining({
        data: {
          event: {
            ...grid,
            content: {
              ...grid.content,
              sessions: [
                {
                  trackId: 'track-0',
                  timeSlotId: 'timeslot-0',
                  topicId: 'topic-0',
                },
              ],
            },
          },
        },
      })
    );
  });

  it('should restore the eager update on errors', async () => {
    mockInitializeSpaceParent(widgetApi);

    const grid = widgetApi.mockSendStateEvent(mockSessionGrid());

    widgetApi.sendStateEvent.mockRejectedValue(new Error('an error'));

    const store = createStore({ widgetApi });

    await expect(
      updateSessionGrid(
        { dispatch: store.dispatch, extra: { widgetApi } },
        (draft) => {
          draft.sessions.push({
            trackId: 'track-0',
            timeSlotId: 'timeslot-0',
            topicId: 'topic-0',
          });
        }
      )
    ).resolves.toEqual({
      error: { name: 'UpdateFailed', message: 'an error' },
    });

    expect(
      sessionGridApi.endpoints.getSessionGrid.select()(store.getState())
    ).toEqual(expect.objectContaining({ data: { event: grid } }));
  });
});
