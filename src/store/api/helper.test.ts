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

import { DateTime } from 'luxon';
import { TimeSlot } from '../../lib/events';
import { recalculateTimeSlotTimestamps } from './helper';

describe('recalculateTimeSlotTimestamps', () => {
  it('should reset gaps in the time slots', () => {
    const timeSlots: TimeSlot[] = [
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts3',
        type: 'sessions',
        startTime: '2020-01-01T02:30:00Z',
        endTime: '2020-01-01T04:00:00Z',
      },
      {
        id: 'ts5',
        type: 'sessions',
        startTime: '2020-01-01T06:30:00Z',
        endTime: '2020-01-01T07:10:00Z',
      },
    ];

    expect(recalculateTimeSlotTimestamps(timeSlots)).toEqual([
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts3',
        type: 'sessions',
        startTime: '2020-01-01T01:00:00Z',
        endTime: '2020-01-01T02:30:00Z',
      },
      {
        id: 'ts5',
        type: 'sessions',
        startTime: '2020-01-01T02:30:00Z',
        endTime: '2020-01-01T03:10:00Z',
      },
    ]);
  });

  it('should restore overlapping time slots', () => {
    const timeSlots: TimeSlot[] = [
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts2',
        type: 'sessions',
        startTime: '2020-01-01T00:50:00Z',
        endTime: '2020-01-01T01:20:00Z',
      },
      {
        id: 'ts3',
        type: 'sessions',
        startTime: '2020-01-01T01:10:00Z',
        endTime: '2020-01-01T02:40:00Z',
      },
    ];

    expect(recalculateTimeSlotTimestamps(timeSlots)).toEqual([
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts2',
        type: 'sessions',
        startTime: '2020-01-01T01:00:00Z',
        endTime: '2020-01-01T01:30:00Z',
      },
      {
        id: 'ts3',
        type: 'sessions',
        startTime: '2020-01-01T01:30:00Z',
        endTime: '2020-01-01T03:00:00Z',
      },
    ]);
  });

  it('should restore reordered time slots', () => {
    const timeSlots: TimeSlot[] = [
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts3',
        type: 'sessions',
        startTime: '2020-01-01T01:10:00Z',
        endTime: '2020-01-01T02:40:00Z',
      },
      {
        id: 'ts2',
        type: 'sessions',
        startTime: '2020-01-01T00:50:00Z',
        endTime: '2020-01-01T01:20:00Z',
      },
    ];

    expect(recalculateTimeSlotTimestamps(timeSlots)).toEqual([
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts3',
        type: 'sessions',
        startTime: '2020-01-01T01:00:00Z',
        endTime: '2020-01-01T02:30:00Z',
      },
      {
        id: 'ts2',
        type: 'sessions',
        startTime: '2020-01-01T02:30:00Z',
        endTime: '2020-01-01T03:00:00Z',
      },
    ]);
  });

  it('should replace the start time of the first time slot', () => {
    const timeSlots: TimeSlot[] = [
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-01T00:00:00Z',
        endTime: '2020-01-01T01:00:00Z',
      },
      {
        id: 'ts2',
        type: 'sessions',
        startTime: '2020-01-01T00:50:00Z',
        endTime: '2020-01-01T01:20:00Z',
      },
    ];

    expect(
      recalculateTimeSlotTimestamps(timeSlots, {
        forcedStartTime: DateTime.fromISO('2020-01-02T10:00:00Z'),
      })
    ).toEqual([
      {
        id: 'ts1',
        type: 'sessions',
        startTime: '2020-01-02T10:00:00Z',
        endTime: '2020-01-02T11:00:00Z',
      },
      {
        id: 'ts2',
        type: 'sessions',
        startTime: '2020-01-02T11:00:00Z',
        endTime: '2020-01-02T11:30:00Z',
      },
    ]);
  });
});
