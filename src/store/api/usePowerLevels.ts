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
} from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import {
  ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION,
  STATE_EVENT_BARCAMP_LINKED_ROOM,
  STATE_EVENT_BARCAMP_SESSION_GRID,
  STATE_EVENT_BARCAMP_TOPIC,
} from '../../lib/events';
import { useGetPowerLevelsQuery } from './powerLevelsApi';
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
  const { data: roomPowerLevelsResult } = useGetPowerLevelsQuery({});
  let canModerate: boolean | undefined = undefined;
  let canSubmitTopic: boolean | undefined = undefined;
  let canParticipantsSubmitTopics: boolean | undefined = undefined;

  if (spaceRoom?.spaceId && spacePowerLevelsResult) {
    const spacePowerLevels = spacePowerLevelsResult.event?.content;
    canModerate =
      hasStateEventPower(
        spacePowerLevels,
        userId,
        STATE_EVENT_BARCAMP_SESSION_GRID
      ) &&
      hasStateEventPower(spacePowerLevels, userId, STATE_EVENT_BARCAMP_TOPIC) &&
      hasStateEventPower(
        spacePowerLevels,
        userId,
        STATE_EVENT_BARCAMP_LINKED_ROOM
      );
  }

  if (roomPowerLevelsResult) {
    const roomPowerLevels = roomPowerLevelsResult.event?.content;
    canSubmitTopic = hasRoomEventPower(
      roomPowerLevels,
      userId,
      ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
    );
    canParticipantsSubmitTopics = hasRoomEventPower(
      roomPowerLevels,
      undefined,
      ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION
    );
  }

  return { canModerate, canSubmitTopic, canParticipantsSubmitTopics };
}
