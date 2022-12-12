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

import { isValidWidgetsLayoutEvent } from './widgetsLayoutEvent';

describe('isValidWidgetsLayoutEvent', () => {
  it('should accept event', () => {
    expect(
      isValidWidgetsLayoutEvent({
        content: {
          widgets: {
            'widget-id': {
              container: 'top',
              index: 0,
            },
          },
        },
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'io.element.widgets.layout',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidWidgetsLayoutEvent({
        content: {
          widgets: {
            'widget-id': {
              container: 'top',
              additional: 'tmp',
            },
          },
          additional: 'tmp',
        },
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'io.element.widgets.layout',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { widgets: undefined },
    { widgets: null },
    { widgets: 111 },
    {
      widgets: {
        'widget-id': {
          container: 'unknown',
        },
      },
    },
    {
      widgets: {
        'widget-id': {
          container: 'top',
          index: null,
        },
      },
    },
    {
      widgets: {
        'widget-id': {
          container: 'top',
          index: '111',
        },
      },
    },
    {
      widgets: {
        'widget-id': {
          container: 'top',
          width: null,
        },
      },
    },
    {
      widgets: {
        'widget-id': {
          container: 'top',
          width: '111',
        },
      },
    },
    {
      widgets: {
        'widget-id': {
          container: 'top',
          height: null,
        },
      },
    },
    {
      widgets: {
        'widget-id': {
          container: 'top',
          height: '111',
        },
      },
    },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidWidgetsLayoutEvent({
        content: {
          widgets: {
            'widget-id': {
              container: 'top',
              index: 0,
              width: 10,
              height: 10,
            },
          },
          ...patch,
        },
        state_key: '',
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'io.element.widgets.layout',
      })
    ).toBe(false);
  });
});
