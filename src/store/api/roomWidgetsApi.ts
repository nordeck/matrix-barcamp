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
  generateWidgetRegistrationUrl,
  StateEvent,
  WidgetApi,
} from '@matrix-widget-toolkit/api';
import { t } from 'i18next';
import Joi from 'joi';
import { isEqual, isError, last } from 'lodash';
import log from 'loglevel';
import { base32 } from 'rfc4648';
import { getEnvironment } from '../../lib/environment';
import {
  isValidWidgetsEvent,
  isValidWidgetsLayoutEvent,
  STATE_EVENT_WIDGETS,
  STATE_EVENT_WIDGETS_LAYOUT,
  WidgetsEvent,
  WidgetsLayoutEvent,
} from '../../lib/events';
import { widgetRegistration } from '../../lib/registration';
import { ThunkExtraArgument } from '../store';
import { baseApi } from './baseApi';

/**
 * All endpoints that concern the widgets installed in the rooms.
 *
 * @remarks this api extends the {@link baseApi} so it should
 *          not be registered at the store.
 */
export const roomWidgetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    setupLobbyRoomWidgets: builder.mutation<
      {
        widgetsLayout: StateEvent<WidgetsLayoutEvent>;
        widgets: StateEvent<WidgetsEvent>[];
      },
      { roomId: string }
    >({
      async queryFn({ roomId }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;
        const barcampWidgetId = widgetApi.widgetId;

        try {
          const creatorUserId = widgetApi.widgetParameters.userId ?? '';
          const jitsiWidget = await applyWidget(
            widgetApi,
            roomId,
            createJitsiWidget(
              roomId,
              creatorUserId,
              // We don't have the name of the lobby room, let's just call the
              // conference "Lobby"
              t('widgets.jitsi.lobbyConferenceTitle', 'Lobby')
            )
          );

          const widgetsLayout = await applyWidgetsLayout(widgetApi, roomId, {
            widgets: {
              [jitsiWidget.state_key]: {
                container: 'top',
                index: 0,
                width: 50,
                height: 100,
              },
              [barcampWidgetId]: {
                container: 'top',
                index: 1,
                width: 50,
                height: 100,
              },
            },
          });

          return {
            data: {
              widgetsLayout,
              widgets: [jitsiWidget],
            },
          };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update widgets: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),

    setupSessionRoomWidgets: builder.mutation<
      {
        widgetsLayout: StateEvent<WidgetsLayoutEvent>;
        widgets: StateEvent<WidgetsEvent>[];
      },
      { roomId: string; roomName: string }
    >({
      async queryFn({ roomId, roomName }, { extra }) {
        const { widgetApi } = extra as ThunkExtraArgument;

        try {
          const creatorUserId = widgetApi.widgetParameters.userId ?? '';
          const barcampWidget = await applyWidget(
            widgetApi,
            roomId,
            createBarCampWidget(creatorUserId)
          );
          const jitsiWidget = await applyWidget(
            widgetApi,
            roomId,
            createJitsiWidget(roomId, creatorUserId, roomName)
          );

          const extraWidgets = [];
          for (const extraWidget of getExtraWidgetsWidgets(creatorUserId)) {
            const widget = await applyWidget(widgetApi, roomId, extraWidget);

            extraWidgets.push(widget);
          }

          let widgetsLayout: StateEvent<WidgetsLayoutEvent>;
          if (extraWidgets.length > 0) {
            widgetsLayout = await applyWidgetsLayout(widgetApi, roomId, {
              widgets: {
                [jitsiWidget.state_key]: {
                  container: 'top',
                  index: 0,
                  width: 50,
                  height: 100,
                },
                [extraWidgets[0].state_key]: {
                  container: 'top',
                  index: 1,
                  width: 30,
                  height: 100,
                },
                [barcampWidget.state_key]: {
                  container: 'top',
                  index: 2,
                  width: 20,
                  height: 100,
                },
              },
            });
          } else {
            widgetsLayout = await applyWidgetsLayout(widgetApi, roomId, {
              widgets: {
                [jitsiWidget.state_key]: {
                  container: 'top',
                  index: 0,
                  width: 80,
                  height: 100,
                },
                [barcampWidget.state_key]: {
                  container: 'top',
                  index: 1,
                  width: 20,
                  height: 100,
                },
              },
            });
          }

          return {
            data: {
              widgetsLayout,
              widgets: [jitsiWidget, ...extraWidgets],
            },
          };
        } catch (e) {
          return {
            error: {
              name: 'UpdateFailed',
              message: `Could not update widgets: ${
                isError(e) ? e.message : e
              }`,
            },
          };
        }
      },
    }),
  }),
});

function createBarCampWidget(creatorUserId: string): WidgetsEvent {
  return {
    type: widgetRegistration.type,
    url: generateWidgetRegistrationUrl(),
    name: widgetRegistration.name,
    id: 'barcamp',
    creatorUserId,
  };
}

function createJitsiWidget(
  roomId: string,
  creatorUserId: string,
  roomName: string = ''
): WidgetsEvent {
  const elementBaseUrl = getEnvironment(
    'REACT_APP_ELEMENT_BASE_URL',
    'https://app.element.io'
  );
  const jitsiHostName = getEnvironment(
    'REACT_APP_JITSI_HOST_NAME',
    'jitsi.riot.im'
  );
  const conferenceId = base32.stringify(new TextEncoder().encode(roomId), {
    pad: false,
  });

  const widgetUrl = new URL('./jitsi.html', elementBaseUrl);
  // To support v1 widgets:
  widgetUrl.searchParams.set('confId', conferenceId);
  // Do not escape the values, as the $ sign should not be escaped
  widgetUrl.hash = `#${Object.entries({
    conferenceId: '$conferenceId',
    domain: '$domain',
    displayName: '$matrix_display_name',
    avatarUrl: '$matrix_avatar_url',
    userId: '$matrix_user_id',
    roomId: '$matrix_room_id',
    roomName: '$roomName',
    theme: '$theme',
  })
    .map(([k, v]) => `${k}=${v}`)
    .join('&')}`;
  const name = t('widgets.jitsi.title', 'Video Conference');

  return {
    type: 'jitsi',
    url: widgetUrl.toString(),
    name,
    data: {
      domain: jitsiHostName,
      conferenceId,
      roomName,
    },
    id: 'jitsi',
    creatorUserId,
  };
}

const extraWidgetsSchema = Joi.array<
  Array<{
    id: string;
    type: string;
    name: string;
    url: string;
  }>
>().items(
  Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    name: Joi.string().required(),
    url: Joi.string().uri().required(),
  }).unknown(true)
);

export function getExtraWidgetsWidgets(creatorUserId: string): WidgetsEvent[] {
  const widgetsRaw = getEnvironment('REACT_APP_EXTRA_WIDGETS', '[]');
  const { error, value: widgets = [] } = extraWidgetsSchema.validate(
    JSON.parse(widgetsRaw)
  );

  if (error) {
    log.warn('Error while validating event', error);
    return [];
  }

  return widgets.map((w) => ({
    type: w.type,
    url: w.url,
    name: w.name,
    id: w.id,
    creatorUserId,
  }));
}

async function applyWidget(
  widgetApi: WidgetApi,
  roomId: string,
  widget: WidgetsEvent
): Promise<StateEvent<WidgetsEvent>> {
  const widgetsEvents = await widgetApi.receiveStateEvents(
    STATE_EVENT_WIDGETS,
    { roomIds: [roomId] }
  );
  const widgetsEvent = last(
    widgetsEvents
      .filter(isValidWidgetsEvent)
      .filter((e) => e.content.type === widget.type)
  );
  const id = widgetsEvent?.state_key ?? widget.id;
  const content = {
    ...(widgetsEvent?.content ?? {}),
    ...widget,
    id,
  };

  if (widgetsEvent && isEqual(widgetsEvent.content, content)) {
    // No change necessary
    return widgetsEvent;
  }

  return await widgetApi.sendStateEvent(STATE_EVENT_WIDGETS, content, {
    roomId,
    stateKey: id,
  });
}

async function applyWidgetsLayout(
  widgetApi: WidgetApi,
  roomId: string,
  widgetsLayout: WidgetsLayoutEvent
): Promise<StateEvent<WidgetsLayoutEvent>> {
  const widgetsLayoutEvents = await widgetApi.receiveStateEvents(
    STATE_EVENT_WIDGETS_LAYOUT,
    { roomIds: [roomId] }
  );
  const widgetsLayoutEvent = last(
    widgetsLayoutEvents.filter(isValidWidgetsLayoutEvent)
  );

  if (
    widgetsLayoutEvent &&
    isEqual(widgetsLayoutEvent.content, widgetsLayout)
  ) {
    // No change necessary
    return widgetsLayoutEvent;
  }

  return await widgetApi.sendStateEvent(
    STATE_EVENT_WIDGETS_LAYOUT,
    widgetsLayout,
    { roomId }
  );
}

export const {
  useSetupLobbyRoomWidgetsMutation,
  useSetupSessionRoomWidgetsMutation,
} = roomWidgetsApi;
