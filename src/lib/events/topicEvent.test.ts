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

import { isValidTopicEvent } from './topicEvent';

describe('isValidTopicEvent', () => {
  it('should accept event', () => {
    expect(
      isValidTopicEvent({
        content: {
          title: 'A title',
          description: 'A description',
          authors: [{ id: 'author' }],
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic',
      })
    ).toBe(true);
  });

  it('should accept pinned topic event', () => {
    expect(
      isValidTopicEvent({
        content: {
          title: 'A title',
          description: 'A description',
          authors: [{ id: 'author' }],
          pinned: true,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidTopicEvent({
        content: {
          title: 'A title',
          description: 'A description',
          authors: [{ id: 'author' }],
          additional: 'tmp',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { title: undefined },
    { title: null },
    { title: 111 },
    { description: undefined },
    { description: null },
    { description: 111 },
    { authors: undefined },
    { authors: null },
    { authors: 111 },
    { authors: [111] },
    { authors: [{ id: null }] },
    { authors: [{ id: 111 }] },
    { authors: [] },
    { pinned: 111 },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidTopicEvent({
        content: {
          title: 'A title',
          description: 'A description',
          authors: [{ id: 'author' }],
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic',
      })
    ).toBe(false);
  });
});
