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

import { RelatesTo, RoomEvent } from '@matrix-widget-toolkit/api';
import Joi from 'joi';
import { isValidEvent } from './validation';

export const ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION =
  'net.nordeck.barcamp.topic_submission';

/**
 * A user submission for a topic
 */
export type TopicSubmissionEvent = {
  /** The title of the submission */
  title: string;
  /** The description of the submission */
  description: string;
  /** The relation to the start event of the session grid */
  'm.relates_to'?: RelatesTo<'m.reference'>;
};

const topicSubmissionEventSchema = Joi.object<TopicSubmissionEvent, true>({
  title: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  'm.relates_to': Joi.object({
    rel_type: Joi.string().valid('m.reference').required(),
    event_id: Joi.string().required(),
  }),
}).unknown();

export function isValidTopicSubmissionEvent(
  event: RoomEvent<unknown>
): event is RoomEvent<TopicSubmissionEvent> {
  return isValidEvent(
    event,
    ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
    topicSubmissionEventSchema
  );
}
