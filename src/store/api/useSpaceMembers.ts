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

import { getRoomMemberDisplayName } from '@matrix-widget-toolkit/api';
import { useCallback } from 'react';
import {
  selectRoomMember,
  selectRoomMembers,
  useGetRoomMembersQuery,
} from './roomMemberApi';

export function useSpaceMembers(): {
  lookupDisplayName: (userId: string) => string;
} {
  const { data } = useGetRoomMembersQuery();

  const lookupDisplayName = useCallback(
    (userId: string): string => {
      if (!data) {
        return userId;
      }

      const roomMemberEvent = selectRoomMember(data, userId);

      if (!roomMemberEvent) {
        return userId;
      }

      const roomMemberEvents = selectRoomMembers(data);
      return getRoomMemberDisplayName(roomMemberEvent, roomMemberEvents);
    },
    [data]
  );

  // TODO: Support avatar lookup in the future

  return { lookupDisplayName };
}
