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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { Session } from '../../lib/events';
import { selectLinkedRoom, useGetLinkedRoomsQuery } from './linkedRoomApi';
import { useGetSessionGridQuery } from './sessionGridApi';

export function useSessionTopic(): { session: Session | undefined } {
  const widgetApi = useWidgetApi();
  const roomId = widgetApi.widgetParameters.roomId ?? '';
  const { data: sessionGrid } = useGetSessionGridQuery();
  const { data: linkedRooms } = useGetLinkedRoomsQuery();

  if (!linkedRooms || !sessionGrid?.event) {
    return { session: undefined };
  }

  if (sessionGrid.event.state_key === roomId) {
    // Inside lobby room
    return { session: undefined };
  }

  const linkedRoom = selectLinkedRoom(linkedRooms, roomId);

  if (
    !linkedRoom ||
    linkedRoom.content.sessionGridId !== sessionGrid.event.state_key
  ) {
    return { session: undefined };
  }

  const session = sessionGrid.event.content.sessions.find(
    (s) => s.topicId === linkedRoom.content.topicId
  );

  return { session };
}
