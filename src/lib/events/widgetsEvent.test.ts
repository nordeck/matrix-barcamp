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

import { isValidWidgetsEvent } from './widgetsEvent';

describe('isValidWidgetsEvent', () => {
  it('should accept event', () => {
    expect(
      isValidWidgetsEvent({
        content: {
          id: 'widget-id',
          creatorUserId: '@user-id',
          type: 'com.example.widget',
          url: 'https://example.com',
        },
        state_key: 'widget-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'im.vector.modular.widgets',
      })
    ).toBe(true);
  });

  it('should accept event with data', () => {
    expect(
      isValidWidgetsEvent({
        content: {
          id: 'widget-id',
          creatorUserId: '@user-id',
          type: 'com.example.widget',
          url: 'https://example.com',
          data: {
            key: 'value',
          },
        },
        state_key: 'widget-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'im.vector.modular.widgets',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidWidgetsEvent({
        content: {
          id: 'widget-id',
          creatorUserId: '@user-id',
          type: 'com.example.widget',
          url: 'https://example.com',
          additional: 'tmp',
        },
        state_key: 'widget-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'im.vector.modular.widgets',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { id: undefined },
    { id: null },
    { id: 111 },
    { creatorUserId: undefined },
    { creatorUserId: null },
    { creatorUserId: 111 },
    { name: null },
    { name: 111 },
    { type: undefined },
    { type: null },
    { type: 111 },
    { url: undefined },
    { url: null },
    { url: 111 },
    { waitForIframeLoad: null },
    { waitForIframeLoad: 111 },
    { data: null },
    { data: 111 },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidWidgetsEvent({
        content: {
          title: 'My Topic',
          description: 'I want to talk about…',
          ...patch,
        },
        state_key: 'widget-id',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'im.vector.modular.widgets',
      })
    ).toBe(false);
  });
});
