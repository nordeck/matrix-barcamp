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
  generateRoomTimelineCapabilities,
  STATE_EVENT_POWER_LEVELS,
  STATE_EVENT_ROOM_MEMBER,
  WIDGET_CAPABILITY_NAVIGATE,
} from '@matrix-widget-toolkit/api';
import {
  EventDirection,
  Symbols,
  WidgetEventCapability,
} from 'matrix-widget-api';
import {
  ROOM_EVENT_BARCAMP_SESSION_GRID_START,
  ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
  STATE_EVENT_BARCAMP_LINKED_ROOM,
  STATE_EVENT_BARCAMP_SESSION_GRID,
  STATE_EVENT_BARCAMP_TOPIC,
  STATE_EVENT_ROOM_CREATE,
  STATE_EVENT_ROOM_ENCRYPTION,
  STATE_EVENT_ROOM_HISTORY_VISIBILITY,
  STATE_EVENT_ROOM_NAME,
  STATE_EVENT_ROOM_TOPIC,
  STATE_EVENT_SPACE_CHILD,
  STATE_EVENT_SPACE_PARENT,
  STATE_EVENT_WIDGETS,
  STATE_EVENT_WIDGETS_LAYOUT,
} from './events';

export const widgetRegistration = {
  name: 'BarCamp',
  // "clock" suffix to get a custom icon
  type: 'net.nordeck.barcamp:clock',
};

export const capabilities = [
  WidgetEventCapability.forRoomEvent(
    EventDirection.Receive,
    ROOM_EVENT_BARCAMP_SESSION_GRID_START
  ),
  WidgetEventCapability.forRoomEvent(
    EventDirection.Send,
    ROOM_EVENT_BARCAMP_SESSION_GRID_START
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_BARCAMP_SESSION_GRID
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_BARCAMP_SESSION_GRID
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_BARCAMP_TOPIC
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_BARCAMP_TOPIC
  ),
  WidgetEventCapability.forRoomEvent(
    EventDirection.Receive,
    ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
  ),
  WidgetEventCapability.forRoomEvent(
    EventDirection.Send,
    ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_CREATE
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_SPACE_PARENT
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_SPACE_CHILD
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_SPACE_CHILD
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_MEMBER
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_POWER_LEVELS
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_POWER_LEVELS
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_BARCAMP_LINKED_ROOM
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_BARCAMP_LINKED_ROOM
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_NAME
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_ROOM_NAME
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_TOPIC
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_ROOM_TOPIC
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_WIDGETS
  ),
  WidgetEventCapability.forStateEvent(EventDirection.Send, STATE_EVENT_WIDGETS),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_WIDGETS_LAYOUT
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_WIDGETS_LAYOUT
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_HISTORY_VISIBILITY
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Send,
    STATE_EVENT_ROOM_HISTORY_VISIBILITY
  ),
  WidgetEventCapability.forStateEvent(
    EventDirection.Receive,
    STATE_EVENT_ROOM_ENCRYPTION
  ),
  ...generateRoomTimelineCapabilities(Symbols.AnyRoom),
  WIDGET_CAPABILITY_NAVIGATE,
];
