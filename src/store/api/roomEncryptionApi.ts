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

import { first, isError } from 'lodash';
import {
  isValidRoomEncryptionEvent,
  STATE_EVENT_ROOM_ENCRYPTION,
} from '../../lib/events';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

/**
 * Endpoints to check for encrypted rooms.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const roomEncryptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Returns whether the room is encrypted.
     */
    hasRoomEncryption: builder.query<boolean, { roomId?: string }>({
      queryFn: async ({ roomId }, { extra }) => {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const events = await widgetApi.receiveStateEvents(
            STATE_EVENT_ROOM_ENCRYPTION,
            // { roomIds: roomId ? [roomId] : undefined }
          );
          const event = first(events.filter(isValidRoomEncryptionEvent));
          const isEncrypted = event !== undefined;

          return {
            data: isEncrypted,
          };
        } catch (e) {
          return {
            error: {
              name: 'LoadFailed',
              message: `Could not load the room encryption: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

export const { useHasRoomEncryptionQuery } = roomEncryptionApi;
