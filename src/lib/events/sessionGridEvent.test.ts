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

import { isValidSessionGridEvent } from './sessionGridEvent';

describe('isValidSessionGridEvent', () => {
  it('should accept empty event', () => {
    expect(
      isValidSessionGridEvent({
        content: {
          consumedTopicSubmissions: [],
          tracks: [],
          timeSlots: [],
          sessions: [],
          parkingLot: [],
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.session_grid',
      })
    ).toBe(true);
  });

  it('should accept event', () => {
    expect(
      isValidSessionGridEvent({
        content: {
          consumedTopicSubmissions: ['topic-1'],
          tracks: [
            {
              id: 'track-0',
              name: 'My Track 0',
              icon: 'coffee',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T00:30:00Z',
            },
            {
              id: 'timeslot-1',
              type: 'common-event',
              startTime: '2020-01-01T00:30:00Z',
              endTime: '2020-01-01T01:00:00Z',
              summary: 'Coffee Break',
              icon: 'coffee',
            },
          ],
          sessions: [
            {
              timeSlotId: 'timeslot-0',
              trackId: 'track-1',
              topicId: 'topic-0',
            },
          ],
          parkingLot: [{ topicId: 'topic-1' }],
          topicStartEventId: '$start-event-id',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.session_grid',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidSessionGridEvent({
        content: {
          consumedTopicSubmissions: ['topic-1'],
          tracks: [
            {
              id: 'track-0',
              name: 'My Track 0',
              icon: 'coffee',
              additional: 'tmp',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T00:30:00Z',
              summary: 'Coffee Break',
              icon: 'coffee',
              additional: 'tmp',
            },
            {
              id: 'timeslot-1',
              type: 'common-event',
              startTime: '2020-01-01T00:30:00Z',
              endTime: '2020-01-01T01:00:00Z',
              summary: 'Coffee Break',
              icon: 'coffee',
              additional: 'tmp',
            },
          ],
          sessions: [
            {
              timeSlotId: 'timeslot-0',
              trackId: 'track-1',
              topicId: 'topic-0',
              additional: 'tmp',
            },
          ],
          parkingLot: [{ topicId: 'topic-1', additional: 'tmp' }],
          additional: 'tmp',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.session_grid',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { consumedTopicSubmissions: undefined },
    { consumedTopicSubmissions: null },
    { consumedTopicSubmissions: [111] },
    { tracks: undefined },
    { tracks: null },
    { tracks: [111] },
    { tracks: [{ id: null }] },
    { tracks: [{ id: 111 }] },
    { tracks: [{ name: null }] },
    { tracks: [{ name: 111 }] },
    { tracks: [{ icon: null }] },
    { tracks: [{ icon: 111 }] },
    { timeSlots: undefined },
    { timeSlots: null },
    { timeSlots: [111] },
    { timeSlots: [{ id: null }] },
    { timeSlots: [{ id: 111 }] },
    { timeSlots: [{ type: null }] },
    { timeSlots: [{ type: 111 }] },
    { timeSlots: [{ type: 'another-type' }] },
    { timeSlots: [{ startTime: null }] },
    { timeSlots: [{ startTime: 111 }] },
    { timeSlots: [{ startTime: 'some-string' }] },
    { timeSlots: [{ endTime: null }] },
    { timeSlots: [{ endTime: 111 }] },
    { timeSlots: [{ endTime: 'some-string' }] },
    { timeSlots: [{}, { id: null }] },
    { timeSlots: [{}, { id: 111 }] },
    { timeSlots: [{}, { type: null }] },
    { timeSlots: [{}, { type: 111 }] },
    { timeSlots: [{}, { type: 'another-type' }] },
    { timeSlots: [{}, { startTime: null }] },
    { timeSlots: [{}, { startTime: 111 }] },
    { timeSlots: [{}, { startTime: 'some-string' }] },
    { timeSlots: [{}, { endTime: null }] },
    { timeSlots: [{}, { endTime: 111 }] },
    { timeSlots: [{}, { endTime: 'some-string' }] },
    { timeSlots: [{}, { summary: null }] },
    { timeSlots: [{}, { summary: 111 }] },
    { timeSlots: [{}, { icon: null }] },
    { timeSlots: [{}, { icon: 111 }] },
    { sessions: undefined },
    { sessions: null },
    { sessions: [111] },
    { sessions: [{ timeSlotId: null }] },
    { sessions: [{ timeSlotId: 111 }] },
    { sessions: [{ trackId: null }] },
    { sessions: [{ trackId: 111 }] },
    { sessions: [{ topicId: null }] },
    { sessions: [{ topicId: 111 }] },
    { parkingLot: undefined },
    { parkingLot: null },
    { parkingLot: [111] },
    { parkingLot: [{ topicId: null }] },
    { parkingLot: [{ topicId: 111 }] },
    { topicStartEventId: null },
    { topicStartEventId: 111 },
    { topicStartEventId: '' },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidSessionGridEvent({
        content: {
          consumedTopicSubmissions: ['topic-1'],
          tracks: [
            {
              id: 'track-0',
              name: 'My Track 0',
              icon: 'coffee',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-0',
              type: 'sessions',
              startTime: '2020-01-01T00:00:00Z',
              endTime: '2020-01-01T00:30:00Z',
            },
            {
              id: 'timeslot-1',
              type: 'common-event',
              startTime: '2020-01-01T00:30:00Z',
              endTime: '2020-01-01T01:00:00Z',
              summary: 'Coffee Break',
              icon: 'coffee',
            },
          ],
          sessions: [
            {
              timeSlotId: 'timeslot-0',
              trackId: 'track-1',
              topicId: 'topic-0',
            },
          ],
          parkingLot: [{ topicId: 'topic-1' }],
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        state_key: '',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.session_grid',
      })
    ).toBe(false);
  });
});
