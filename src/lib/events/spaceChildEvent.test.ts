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
  isJoinableSpaceChildEvent,
  isValidSpaceChildEvent,
} from './spaceChildEvent';

describe('isValidSpaceChildEvent', () => {
  it('should accept empty event', () => {
    expect(
      isValidSpaceChildEvent({
        content: {},
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.child',
      })
    ).toBe(true);
  });

  it('should accept event', () => {
    expect(
      isValidSpaceChildEvent({
        content: {
          via: ['test'],
          order: 'first',
          suggested: true,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.child',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidSpaceChildEvent({
        content: {
          additional: 'tmp',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.child',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { via: null },
    { via: 111 },
    { via: [111] },
    { order: null },
    { order: 111 },
    { suggested: null },
    { suggested: 111 },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidSpaceChildEvent({
        content: {
          via: ['test'],
          order: 'first',
          suggested: true,
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.child',
      })
    ).toBe(false);
  });
});

describe('isJoinableSpaceChildEvent', () => {
  it('should accept joinable space child event', () => {
    expect(
      isJoinableSpaceChildEvent({
        content: {
          via: ['matrix.to'],
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      })
    ).toBe(true);
  });

  it.each([undefined, []])(
    'should reject missing via in space child event (%p)',
    (via) => {
      expect(
        isJoinableSpaceChildEvent({
          content: {
            via,
          },
          event_id: '$event-id',
          origin_server_ts: 0,
          room_id: '!room-id',
          state_key: '',
          sender: '@user-id',
          type: 'm.space.parent',
        })
      ).toBe(false);
    }
  );
});
