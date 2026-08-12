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
  PowerLevelsStateEvent,
  RoomEvent,
  RoomMemberStateEventContent,
  StateEvent,
} from '@matrix-widget-toolkit/api';
import { MockedWidgetApi } from '@matrix-widget-toolkit/testing';
import { nanoid } from 'nanoid';
import {
  LinkedRoomEvent,
  RoomCreateEvent,
  RoomEncryptionEvent,
  RoomHistoryVisibilityEvent,
  RoomNameEvent,
  RoomTopicEvent,
  SessionGridEvent,
  SessionGridStartEvent,
  SpaceChildEvent,
  SpaceParentEvent,
  TopicEvent,
  TopicSubmissionEvent,
} from './events';

/**
 * Create a matrix power levels event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockPowerLevelsEvent({
  content = {},
  room_id = '!room-id',
  user_id = '@user-id',
}: {
  content?: Partial<PowerLevelsStateEvent>;
  room_id?: string;
  user_id?: string;
} = {}): StateEvent<PowerLevelsStateEvent> {
  return {
    type: 'm.room.power_levels',
    sender: '@user-id',
    content: {
      users: {
        [user_id]: 100,
      },
      ...content,
    },
    state_key: '',
    origin_server_ts: 0,
    event_id: '$event-id-0',
    room_id,
  };
}

/**
 * Create a matrix power levels event which makes the current user a
 * participant.
 *
 * @remarks Only use for tests
 */
export function mockParticipantPowerLevelsEvent({
  content = {},
  room_id = '!room-id',
  user_id = '@user-id',
}: {
  content?: Partial<PowerLevelsStateEvent>;
  room_id?: string;
  user_id?: string;
} = {}): StateEvent<PowerLevelsStateEvent> {
  return mockPowerLevelsEvent({
    content: {
      users: {
        [user_id]: 0,
      },
      ...content,
    },
    room_id,
  });
}

/**
 * Create a session grid event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockSessionGrid({
  state_key = '!room-id',
  room_id = '!room-id',
  content = {},
}: {
  state_key?: string;
  room_id?: string;
  content?: Partial<SessionGridEvent>;
} = {}): StateEvent<SessionGridEvent> {
  return {
    type: 'net.nordeck.barcamp.session_grid',
    sender: '@user-id',
    content: {
      consumedTopicSubmissions: [],
      sessions: [],
      timeSlots: [],
      tracks: [],
      parkingLot: [],
      topicStartEventId: '$start-event-id',
      ...content,
    },
    state_key,
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a session grid start event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockSessionGridStart({
  event_id = '$start-event-id',
  room_id = '!room-id',
  content = {},
}: {
  event_id?: string;
  room_id?: string;
  content?: Partial<SessionGridStartEvent>;
} = {}): RoomEvent<SessionGridStartEvent> {
  return {
    type: 'net.nordeck.barcamp.session_grid.start',
    sender: '@user-id',
    content: {
      ...content,
    },
    origin_server_ts: 0,
    event_id,
    room_id,
  };
}

/**
 * Create a topic event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockTopic({
  state_key = 'topic-0',
  room_id = '!room-id',
  content = {},
}: {
  state_key?: string;
  room_id?: string;
  content?: Partial<TopicEvent>;
} = {}): StateEvent<TopicEvent> {
  return {
    type: 'net.nordeck.barcamp.topic',
    sender: '@user-id',
    content: {
      title: 'My Topic',
      description: 'A brief description',
      authors: [{ id: '@user' }],
      ...content,
    },
    state_key,
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Setup a parent space.
 *
 * @remarks Only use for tests
 */
export function mockInitializeSpaceParent(
  widgetApi: MockedWidgetApi,
  {
    spaceRoomId = '!space-id',
    room_id = '!room-id',
  }: {
    spaceRoomId?: string;
    room_id?: string;
  } = {}
): {
  createEvent: StateEvent<RoomCreateEvent>;
  parentEvent: StateEvent<SpaceParentEvent>;
  childEvent: StateEvent<SpaceChildEvent>;
  reset: () => void;
} {
  const createEvent = widgetApi.mockSendStateEvent(
    mockRoomCreate({
      room_id: spaceRoomId,
      content: { type: 'm.space' },
    })
  );

  const parentEvent = widgetApi.mockSendStateEvent<SpaceParentEvent>({
    type: 'm.space.parent',
    room_id,
    state_key: spaceRoomId,
    event_id: nanoid(),
    origin_server_ts: Date.now(),
    sender: '@user-id',
    content: { via: ['matrix-to'], canonical: true },
  });

  const childEvent = widgetApi.mockSendStateEvent<SpaceChildEvent>(
    mockSpaceChild({
      room_id: spaceRoomId,
      state_key: room_id,
    })
  );

  const reset = () => {
    delete parentEvent.content.via;
    widgetApi.mockSendStateEvent(parentEvent);
  };

  return { createEvent, parentEvent, childEvent, reset };
}

/**
 * Create a topic submission event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockTopicSubmission({
  origin_server_ts = 0,
  sender = '@user-id',
  room_id = '!room-id',
  event_id = nanoid(),
  content = {},
}: {
  origin_server_ts?: number;
  sender?: string;
  room_id?: string;
  event_id?: string;
  content?: Partial<TopicSubmissionEvent>;
} = {}): RoomEvent<TopicSubmissionEvent> {
  return {
    type: 'net.nordeck.barcamp.topic_submission',
    sender,
    content: {
      title: 'My topic',
      description: 'I would like to talk about…',
      'm.relates_to': {
        rel_type: 'm.reference',
        event_id: '$start-event-id',
      },
      ...content,
    },
    origin_server_ts,
    event_id,
    room_id,
  };
}

/**
 * Create a room member event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomMember({
  event_id = nanoid(),
  room_id = '!room-id',
  state_key = '@user-id',
  content = {},
}: {
  event_id?: string;
  room_id?: string;
  state_key?: string;
  content?: Partial<RoomMemberStateEventContent>;
} = {}): StateEvent<RoomMemberStateEventContent> {
  return {
    type: 'm.room.member',
    sender: '@user-id',
    state_key,
    content: {
      membership: 'join',
      displayname: 'User',
      ...content,
    },
    origin_server_ts: 0,
    event_id,
    room_id,
  };
}

/**
 * Create a room history_visibility event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomHistoryVisibility({
  event_id = nanoid(),
  room_id = '!room-id',
  state_key = '@user-id',
  content = {},
}: {
  event_id?: string;
  room_id?: string;
  state_key?: string;
  content?: Partial<RoomHistoryVisibilityEvent>;
} = {}): StateEvent<RoomHistoryVisibilityEvent> {
  return {
    type: 'm.room.history_visibility',
    sender: '@user-id',
    state_key,
    content: {
      history_visibility: 'invited',
      ...content,
    },
    origin_server_ts: 0,
    event_id,
    room_id,
  };
}

/**
 * Create a linked room event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockLinkedRoom({
  state_key = '!linked-room-id',
  room_id = '!space-id',
  origin_server_ts = 0,
  content = {},
}: {
  state_key?: string;
  room_id?: string;
  origin_server_ts?: number;
  content?: Partial<LinkedRoomEvent>;
} = {}): StateEvent<LinkedRoomEvent> {
  return {
    type: 'net.nordeck.barcamp.linked_room',
    sender: '@user-id',
    content: {
      topicId: 'topic-0',
      sessionGridId: '!room-id',
      ...content,
    },
    state_key,
    origin_server_ts,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room name event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomName({
  room_id = '!linked-room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomNameEvent>;
} = {}): StateEvent<RoomNameEvent> {
  return {
    type: 'm.room.name',
    sender: '@user-id',
    state_key: '',
    content: {
      name: 'Room',
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room name event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomEncryption({
  room_id = '!room-id',
}: {
  room_id?: string;
} = {}): StateEvent<RoomEncryptionEvent> {
  return {
    type: 'm.room.encryption',
    sender: '@user-id',
    state_key: '',
    content: {
      algorithm: 'm.megolm.v1.aes-sha2',
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room create event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomCreate({
  room_id = '!room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomCreateEvent>;
} = {}): StateEvent<RoomCreateEvent> {
  return {
    type: 'm.room.create',
    sender: '@user-id',
    state_key: '',
    content: {
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}

/**
 * Create a room topic event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockRoomTopic({
  room_id = '!linked-room-id',
  content = {},
}: {
  room_id?: string;
  content?: Partial<RoomTopicEvent>;
} = {}): StateEvent<RoomTopicEvent> {
  return {
    type: 'm.room.topic',
    sender: '@user-id',
    state_key: '',
    content: {
      topic: '',
      ...content,
    },
    origin_server_ts: 0,
    event_id: '$event-id',
    room_id,
  };
}
/**
 * Setup a linked room.
 *
 * @remarks Only use for tests
 */
export function mockInitializeLinkableRoom(
  widgetApi: MockedWidgetApi,
  {
    spaceRoomId = '!space-id',
    room_id = '!unassigned-room-id',
    name = 'Room',
  }: {
    spaceRoomId?: string;
    room_id?: string;
    name?: string;
  } = {}
): {
  roomNameEvent: StateEvent<RoomNameEvent>;
  roomTopicEvent: StateEvent<RoomTopicEvent>;
} {
  mockInitializeSpaceParent(widgetApi, { room_id, spaceRoomId });
  widgetApi.mockSendStateEvent(mockRoomCreate({ room_id }));
  const roomNameEvent = widgetApi.mockSendStateEvent(
    mockRoomName({ room_id, content: { name } })
  );
  const roomTopicEvent = widgetApi.mockSendStateEvent(
    mockRoomTopic({ room_id })
  );
  widgetApi.mockSendStateEvent(mockRoomMember({ room_id }));

  return { roomNameEvent, roomTopicEvent };
}

/**
 * Create a space child event with known test data.
 *
 * @remarks Only use for tests
 */
export function mockSpaceChild({
  room_id = '!space-id',
  state_key = '!room-id',
  content = {},
}: {
  room_id?: string;
  state_key?: string;
  content?: Partial<SpaceChildEvent>;
} = {}): StateEvent<SpaceChildEvent> {
  return {
    type: 'm.space.child',
    sender: '@user-id',
    state_key,
    content: {
      via: ['matrix.to'],
      ...content,
    },
    room_id,
    event_id: '$event-id',
    origin_server_ts: 0,
  };
}
