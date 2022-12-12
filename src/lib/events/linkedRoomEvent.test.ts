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

import { isValidLinkedRoomEvent } from './linkedRoomEvent';

describe('isValidLinkedRoomEvent', () => {
  it('should accept event', () => {
    expect(
      isValidLinkedRoomEvent({
        content: {
          topicId: '$id',
          sessionGridId: '!room-id',
        },
        state_key: '!room',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.linked_room',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidLinkedRoomEvent({
        content: {
          topicId: '$id',
          sessionGridId: '!room-id',
          additional: 'tmp',
        },
        state_key: '!room',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.linked_room',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { topicId: undefined },
    { topicId: null },
    { topicId: 111 },
    { topicId: '' },
    { sessionGridId: undefined },
    { sessionGridId: null },
    { sessionGridId: 111 },
    { sessionGridId: '' },
  ])('should reject event with patch %j', (patch: Object) => {
    expect(
      isValidLinkedRoomEvent({
        content: {
          topicId: '!topic',
          sessionGridId: '!room-id',
          ...patch,
        },
        state_key: '!room',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.linked_room',
      })
    ).toBe(false);
  });
});
