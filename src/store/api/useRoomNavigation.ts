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

import { navigateToRoom as navigateToRoomFn } from '@matrix-widget-toolkit/api';
import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useCallback } from 'react';
import {
  isValidSpaceChildEvent,
} from '../../lib/events';
import { useGetSpaceRoomQuery } from './spaceApi';
import { STATE_EVENT_SPACE_CHILD } from '../../lib/events/spaceChildEvent';

export function useRoomNavigation(): {
  navigateToRoom: (roomId: string) => Promise<void>;
} {
  const widgetApi = useWidgetApi();
  const { data } = useGetSpaceRoomQuery();

  const navigateToRoom = useCallback(
    async (roomId: string): Promise<void> => {
      let via: string[] | undefined;
      if (data?.spaceId) {
        const rawEvents = await widgetApi.receiveStateEvents(
          STATE_EVENT_SPACE_CHILD,
          {
            stateKey: roomId,
            // roomIds: [data.spaceId],
          }
        );

        const events = rawEvents.filter(isValidSpaceChildEvent);

        via = events[0]?.content.via;
      }

      await navigateToRoomFn(widgetApi, roomId, { via });
    },
    [data?.spaceId, widgetApi]
  );

  return { navigateToRoom };
}
