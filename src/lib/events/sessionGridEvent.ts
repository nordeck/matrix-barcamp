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

export const STATE_EVENT_BARCAMP_SESSION_GRID =
  'net.nordeck.barcamp.session_grid';

/**
 * A time slot in the time table that can host sessions.
 */
export type SessionsTimeSlot = {
  /** The technical id of the time slot */
  id: string;
  /** The type of event */
  type: 'sessions';
  /** The start time of the time slot as a ISO 8601 string */
  startTime: string;
  /** The end time of the time slot as a ISO 8601 string */
  endTime: string;

  summary?: undefined;
  icon?: undefined;
};

const sessionTimeSlotSchema = Joi.object<SessionsTimeSlot, true>({
  type: Joi.string().allow('sessions'),
  id: Joi.string().required(),
  startTime: Joi.string().isoDate().required(),
  endTime: Joi.string().isoDate().required(),
  summary: Joi.string().allow(null),
  icon: Joi.string().allow(null),
}).unknown();

/**
 * A time slot in the time table that represents a common event.
 */
export type CommonEventTimeSlot = {
  /** The technical id of the time slot */
  id: string;
  /** The type of event */
  type: 'common-event';
  /** The start time of the time slot as a ISO 8601 string */
  startTime: string;
  /** The end time of the time slot as a ISO 8601 string */
  endTime: string;
  /** The summary of the common event */
  summary: string;
  /** The icon of the common event, a icon name from semantic-ui (e.g. from FontAwesome) */
  icon: string;
};

const commonEventTimeSlotSchema = Joi.object<CommonEventTimeSlot, true>({
  type: Joi.string().allow('common-event'),
  id: Joi.string().required(),
  startTime: Joi.string().isoDate().required(),
  endTime: Joi.string().isoDate().required(),
  summary: Joi.string().required(),
  icon: Joi.string().required(),
}).unknown();

/**
 * A time slot in the time table.
 */
export type TimeSlot = SessionsTimeSlot | CommonEventTimeSlot;

/**
 * The different types of time slots
 */
export type TimeSlotTypes = TimeSlot['type'];

const timeSlotSchema = Joi.alternatives().conditional('.type', {
  switch: [
    { is: 'common-event', then: commonEventTimeSlotSchema },
    { is: 'sessions', then: sessionTimeSlotSchema },
  ],
});

/**
 * A track that has a session in each time slot.
 */
export type Track = {
  /** The technical id of the session */
  id: string;
  /** The display name of the session */
  name: string;
  /** The icon of the session, a icon name from semantic-ui (e.g. from FontAwesome) */
  icon: string;
};

const trackSchema = Joi.object<Track, true>({
  id: Joi.string().required(),
  name: Joi.string().required(),
  icon: Joi.string().required(),
}).unknown();

/**
 * A session that places a topic on the grid
 */
export type Session = {
  /** The topic in the session */
  topicId: string;
  /** The ID of the track */
  trackId: string;
  /** The ID of the time slot */
  timeSlotId: string;
};

const sessionSchema = Joi.object<Session, true>({
  topicId: Joi.string().required(),
  trackId: Joi.string().required(),
  timeSlotId: Joi.string().required(),
}).unknown();

export type ParkingLotEntry = {
  /** The topic in the entry */
  topicId: string;
};

const parkingLotEntrySchema = Joi.object<ParkingLotEntry, true>({
  topicId: Joi.string().required(),
}).unknown();

export type SessionGridEvent = {
  consumedTopicSubmissions: string[];
  tracks: Track[];
  timeSlots: TimeSlot[];
  sessions: Session[];
  parkingLot: ParkingLotEntry[];
};

const sessionGridEventSchema = Joi.object<SessionGridEvent, true>({
  consumedTopicSubmissions: Joi.array().items(Joi.string()).min(0).required(),
  tracks: Joi.array().items(trackSchema).min(0).required(),
  timeSlots: Joi.array().items(timeSlotSchema).min(0).required(),
  sessions: Joi.array().items(sessionSchema).min(0).required(),
  parkingLot: Joi.array().items(parkingLotEntrySchema).min(0).required(),
}).unknown();

export function isValidSessionGridEvent(
  event: StateEvent<unknown>
): event is StateEvent<SessionGridEvent> {
  return isValidEvent(
    event,
    STATE_EVENT_BARCAMP_SESSION_GRID,
    sessionGridEventSchema
  );
}
