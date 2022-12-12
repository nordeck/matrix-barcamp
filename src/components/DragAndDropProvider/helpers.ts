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

import { DraggableLocation } from 'react-beautiful-dnd';

export type DroppableLocation =
  | {
      type: 'parkingLot';
      index: number;
    }
  | {
      type: 'timeSlot';
      index: number;
    }
  | { type: 'session'; timeSlotId: string; trackId: string };

export function parseDroppableLocation(
  location: DraggableLocation
): DroppableLocation {
  if (location.droppableId === 'parkingLot') {
    return { type: 'parkingLot', index: location.index };
  }
  if (location.droppableId === 'timeSlot') {
    return { type: 'timeSlot', index: location.index };
  }

  const match = location.droppableId.match(/^session ([^ ]*) ([^ ]*)$/);

  if (!match || match.length !== 3) {
    throw new Error(`Unknown droppable location: ${location.droppableId}`);
  }

  const trackId = match[1];
  const timeSlotId = match[2];

  return { type: 'session', trackId, timeSlotId };
}

export function stringifyDroppableId(
  location:
    | { type: 'parkingLot' }
    | { type: 'timeSlot' }
    | { type: 'session'; timeSlotId: string; trackId: string }
): string {
  if (location.type === 'parkingLot') {
    return 'parkingLot';
  }

  if (location.type === 'timeSlot') {
    return 'timeSlot';
  }

  // We are using spaces as separators as nanoid can generate identifiers with
  // '-' and '_' characters.
  return `session ${location.trackId} ${location.timeSlotId}`;
}
