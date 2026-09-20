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

import { isValidTopicSubmissionEvent } from './topicSubmissionEvent';

describe('isValidTopicSubmissionEvent', () => {
  it('should accept event', () => {
    expect(
      isValidTopicSubmissionEvent({
        content: {
          title: 'My Topic',
          description: 'I want to talk about…',
          'm.relates_to': {
            rel_type: 'm.reference',
            event_id: '$event-id',
          },
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic_submission',
      })
    ).toBe(true);
  });

  it('should accept event without relation', () => {
    expect(
      isValidTopicSubmissionEvent({
        content: {
          title: 'My Topic',
          description: 'I want to talk about…',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic_submission',
      })
    ).toBe(true);
  });

  it('should accept event with a different author', () => {
    expect(
      isValidTopicSubmissionEvent({
        content: {
          title: 'My Topic',
          description: 'I want to talk about…',
          author: '@another-user-id',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic_submission',
      })
    ).toBe(true);
  });

  it('should accept additional properties', () => {
    expect(
      isValidTopicSubmissionEvent({
        content: {
          title: 'My Topic',
          description: 'I want to talk about…',
          additional: 'tmp',
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic_submission',
      })
    ).toBe(true);
  });

  it.each<Object>([
    { title: undefined },
    { title: null },
    { title: 111 },
    { title: '' },
    { description: undefined },
    { description: null },
    { description: 111 },
    { description: '' },
    { author: null },
    { author: 111 },
    { author: '' },
    { 'm.relates_to': { rel_type: undefined, event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: null, event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: '', event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: 'm.replace', event_id: '$event-id' } },
    { 'm.relates_to': { rel_type: 'm.reference', event_id: undefined } },
    { 'm.relates_to': { rel_type: 'm.reference', event_id: null } },
    { 'm.relates_to': { rel_type: 'm.reference', event_id: '' } },
  ])('should reject event with patch %p', (patch: Object) => {
    expect(
      isValidTopicSubmissionEvent({
        content: {
          title: 'My Topic',
          description: 'I want to talk about…',
          ...patch,
        },
        event_id: '$event-id',
        origin_server_ts: 0,
        room_id: '!room-id',
        sender: '@user-id',
        type: 'net.nordeck.barcamp.topic_submission',
      })
    ).toBe(false);
  });
});
