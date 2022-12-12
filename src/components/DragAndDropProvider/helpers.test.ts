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

import { parseDroppableLocation, stringifyDroppableId } from './helpers';

describe('parseDroppableLocation', () => {
  it('should parse parking lot location', () => {
    const result = parseDroppableLocation({
      droppableId: 'parkingLot',
      index: 4,
    });

    expect(result).toEqual({
      type: 'parkingLot',
      index: 4,
    });
  });

  it('should parse time slot location', () => {
    const result = parseDroppableLocation({
      droppableId: 'timeSlot',
      index: 4,
    });

    expect(result).toEqual({
      type: 'timeSlot',
      index: 4,
    });
  });

  it('should parse session location', () => {
    const result = parseDroppableLocation({
      droppableId: 'session track-id-1 timeslot-id-1',
      index: 0,
    });

    expect(result).toEqual({
      type: 'session',
      trackId: 'track-id-1',
      timeSlotId: 'timeslot-id-1',
    });
  });

  it('should fail if location is invalid', () => {
    expect(() =>
      parseDroppableLocation({
        droppableId: 'test a',
        index: 0,
      })
    ).toThrowError(/Unknown droppable location/);
  });
});

describe('stringifyDroppableId', () => {
  it('should stringify droppable id for parking lot', () => {
    expect(
      stringifyDroppableId({
        type: 'parkingLot',
      })
    ).toEqual('parkingLot');
  });

  it('should stringify droppable id for time slot', () => {
    expect(
      stringifyDroppableId({
        type: 'timeSlot',
      })
    ).toEqual('timeSlot');
  });

  it('should stringify droppable id for session', () => {
    expect(
      stringifyDroppableId({
        type: 'session',
        trackId: 'my-track',
        timeSlotId: 'my-slot',
      })
    ).toEqual('session my-track my-slot');
  });
});
