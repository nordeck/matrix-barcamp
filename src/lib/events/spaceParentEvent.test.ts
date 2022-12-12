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
  isCanonicalSpaceParentEvent,
  isValidSpaceParentEvent,
} from './spaceParentEvent';

describe('isValidSpaceParentEvent', () => {
  it('should accept event', () => {
    expect(
      isValidSpaceParentEvent({
        content: {},
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      })
    ).toBe(true);
  });

  it('should accept via and canonical event', () => {
    expect(
      isValidSpaceParentEvent({
        content: {
          canonical: true,
          via: ['test'],
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

  it('should accept additional properties', () => {
    expect(
      isValidSpaceParentEvent({
        content: {
          additional: 'tmp',
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

  it.each<Object>([
    { canonical: null },
    { canonical: 111 },
    { via: null },
    { via: 111 },
    { via: [111] },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidSpaceParentEvent({
        content: {
          canonical: true,
          via: ['test'],
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      })
    ).toBe(false);
  });
});

describe('isCanonicalSpaceParentEvent', () => {
  it('should accept canonical space parent event', () => {
    expect(
      isCanonicalSpaceParentEvent({
        content: {
          via: ['matrix.to'],
          canonical: true,
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

  it('should reject non-canonical space parent event', () => {
    expect(
      isCanonicalSpaceParentEvent({
        content: {
          via: ['matrix.to'],
          canonical: false,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'm.space.parent',
      })
    ).toBe(false);
  });

  it.each([undefined, []])(
    'should reject missing via in space parent event (%p)',
    (via) => {
      expect(
        isCanonicalSpaceParentEvent({
          content: {
            via,
            canonical: true,
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
