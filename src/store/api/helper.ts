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

/**
 * Redistribute the time slots according to their duration.
 *
 * All start and end times are recalculated based on:
 * 1. the start of the first time slot
 * 2. the duration of each time slot
 *
 * @param timeSlots - a list of time slots
 * @param opts - a list of options
 *               `forcedStartTime` is the start time that should be
 *               used to start the fist session.
 * @returns a cleaned up list where all time slots are scheduled end-to-end
 */
export function recalculateTimeSlotTimestamps(
  timeSlots: TimeSlot[],
  opts?: { forcedStartTime?: DateTime }
): TimeSlot[] {
  if (timeSlots.length < 0) {
    return timeSlots;
  }

  let lastEndTime =
    opts?.forcedStartTime ?? DateTime.fromISO(timeSlots[0].startTime);

  return timeSlots.map((timeSlot) => {
    const startTime = DateTime.fromISO(timeSlot.startTime);
    const endTime = DateTime.fromISO(timeSlot.endTime);
    const duration = endTime.diff(startTime);

    const nextStartTime = lastEndTime;
    lastEndTime = lastEndTime.plus(duration);

    return {
      ...timeSlot,
      startTime: nextStartTime.toISO({ suppressMilliseconds: true }) ?? '',
      endTime: lastEndTime.toISO({ suppressMilliseconds: true }) ?? '',
    };
  });
}
