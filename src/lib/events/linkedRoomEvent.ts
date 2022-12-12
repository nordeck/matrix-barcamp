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

import { StateEvent } from '@matrix-widget-toolkit/api';
import Joi from 'joi';
import { isValidEvent } from './validation';

export const STATE_EVENT_BARCAMP_LINKED_ROOM =
  'net.nordeck.barcamp.linked_room';

export type LinkedRoomEvent = {
  /** the state key of the session grid that holds the topic */
  sessionGridId: string;
  /** the ID of the topic that is assigned to this room */
  topicId: string;
};

const linkedRoomEventSchema = Joi.object<LinkedRoomEvent, true>({
  sessionGridId: Joi.string().required(),
  topicId: Joi.string().required(),
}).unknown();

export function isValidLinkedRoomEvent(
  event: StateEvent<unknown>
): event is StateEvent<LinkedRoomEvent> {
  return isValidEvent(
    event,
    STATE_EVENT_BARCAMP_LINKED_ROOM,
    linkedRoomEventSchema
  );
}
