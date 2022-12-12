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

export const STATE_EVENT_BARCAMP_TOPIC = 'net.nordeck.barcamp.topic';

export type TopicAuthor = {
  // The id of the author
  id: string;
};

const topicAuthorSchema = Joi.object<TopicAuthor, true>({
  id: Joi.string().required(),
}).unknown();

/**
 * A topic
 */
export type TopicEvent = {
  /** The title */
  title: string;
  /** The description */
  description: string;
  /** The authors */
  authors: TopicAuthor[];
  /** if true, the topic has a visual marker to tell it shouldn't be moved */
  pinned?: boolean;
};

const topicEventSchema = Joi.object<TopicEvent, true>({
  title: Joi.string().required(),
  description: Joi.string().required(),
  authors: Joi.array().items(topicAuthorSchema).min(1).required(),
  pinned: Joi.bool(),
}).unknown();

export function isValidTopicEvent(
  event: StateEvent<unknown>
): event is StateEvent<TopicEvent> {
  return isValidEvent(event, STATE_EVENT_BARCAMP_TOPIC, topicEventSchema);
}
