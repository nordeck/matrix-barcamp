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

import {
  hasRoomEventPower,
  hasStateEventPower,
  PowerLevelsStateEvent,
  ROOM_VERSION_12_CREATOR,
  UserPowerLevelType,
} from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
  STATE_EVENT_BARCAMP_LINKED_ROOM,
  STATE_EVENT_BARCAMP_SESSION_GRID,
  STATE_EVENT_BARCAMP_TOPIC,
} from '../../lib/events';
import {
  useGetPowerLevelsQuery,
  useGetCreateEventQuery,
} from './powerLevelsApi';
import { useGetSpaceRoomQuery } from './spaceApi';

export type PowerLevels = {
  canModerate: boolean | undefined;
  canSubmitTopic: boolean | undefined;
  canParticipantsSubmitTopics: boolean | undefined;
};

export function usePowerLevels(): PowerLevels {
  const widgetApi = useWidgetApi();
  const userId = widgetApi.widgetParameters.userId;
  const { data: spaceRoom } = useGetSpaceRoomQuery();
  const { data: spacePowerLevelsResult } = useGetPowerLevelsQuery({
    roomId: spaceRoom?.spaceId,
  });
  const { data: createEvent } = useGetCreateEventQuery();
  const { data: roomPowerLevelsResult } = useGetPowerLevelsQuery({});
  let canModerate: boolean | undefined = undefined;
  let canSubmitTopic: boolean | undefined = undefined;
  let canParticipantsSubmitTopics: boolean | undefined = undefined;

  if (spaceRoom?.spaceId && spacePowerLevelsResult) {
    const spacePowerLevels = spacePowerLevelsResult.event?.content;
    canModerate =
      hasStateEventPower(
        spacePowerLevels,
        createEvent?.event,
        userId,
        STATE_EVENT_BARCAMP_SESSION_GRID
      ) &&
      hasStateEventPower(spacePowerLevels, createEvent?.event, userId, STATE_EVENT_BARCAMP_TOPIC) &&
      hasStateEventPower(
        spacePowerLevels,
        createEvent?.event,
        userId,
        STATE_EVENT_BARCAMP_LINKED_ROOM
      );
  }

  if (roomPowerLevelsResult) {
    const roomPowerLevels = roomPowerLevelsResult.event?.content;
    canSubmitTopic = hasRoomEventPower(
      roomPowerLevels,
      createEvent?.event,
      userId,
      ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
    );
    canParticipantsSubmitTopics = _hasRoomEventPower(
      roomPowerLevels,
      undefined,
      ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
    );
  }

  return { canModerate, canSubmitTopic, canParticipantsSubmitTopics };
}

function _hasRoomEventPower(
  powerLevelStateEvent: PowerLevelsStateEvent | undefined,
  userId: string | undefined,
  eventType: string,
): boolean {
  const userLevel = _calculateUserPowerLevel(
    powerLevelStateEvent,
    userId,
  );
  const eventLevel = calculateRoomEventPowerLevel(
    powerLevelStateEvent,
    eventType,
  );
  return compareUserPowerLevelToNormalPowerLevel(userLevel, eventLevel);
}

function _calculateUserPowerLevel(
  powerLevelStateEvent: PowerLevelsStateEvent | undefined,
  userId?: string,
): number {
  // See https://github.com/matrix-org/matrix-spec/blob/203b9756f52adfc2a3b63d664f18cdbf9f8bf126/data/event-schemas/schema/m.room.power_levels.yaml#L8-L12
  return (
    (userId ? powerLevelStateEvent?.users?.[userId] : undefined) ??
    powerLevelStateEvent?.users_default ??
    0
  );
}

export function calculateRoomEventPowerLevel(
  powerLevelStateEvent: PowerLevelsStateEvent | undefined,
  eventType: string,
): number {
  // See https://github.com/matrix-org/matrix-spec/blob/203b9756f52adfc2a3b63d664f18cdbf9f8bf126/data/event-schemas/schema/m.room.power_levels.yaml#L14-L19
  return (
    powerLevelStateEvent?.events?.[eventType] ??
    powerLevelStateEvent?.events_default ??
    0
  );
}

export function compareUserPowerLevelToNormalPowerLevel(
  userPowerLevel: UserPowerLevelType,
  normalPowerLevel: number,
): boolean {
  if (userPowerLevel === ROOM_VERSION_12_CREATOR) {
    // Room version 12 creator has the highest power level.
    return true;
  }
  if (typeof userPowerLevel !== 'number') {
    // If the user power level is not a number, we cannot compare it to a normal power level.
    return false;
  }
  // Compare the user power level to the normal power level.
  return userPowerLevel >= normalPowerLevel;
}
