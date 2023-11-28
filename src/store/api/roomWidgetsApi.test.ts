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

import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { getEnvironment } from '../../lib/environment';
import { createStore } from '../store';
import { getExtraWidgetsWidgets, roomWidgetsApi } from './roomWidgetsApi';

jest.mock('../../lib/environment');

let widgetApi: MockedWidgetApi;

afterEach(() => widgetApi.stop());

beforeEach(() => (widgetApi = mockWidgetApi()));

beforeEach(() => {
  jest
    .mocked(getEnvironment)
    .mockImplementation((_, defaultValue) => defaultValue);
});

describe('setupLobbyRoomWidgets', () => {
  it('should setup jitsi widget and widget layout', async () => {
    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomWidgetsApi.endpoints.setupLobbyRoomWidgets.initiate({
          roomId: '!room-id',
        })
      )
      .unwrap();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(2);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
          domain: 'jitsi.riot.im',
          roomName: 'Lobby',
        },
        id: 'jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'https://app.element.io/jitsi.html?confId=EFZG633NFVUWI#conferenceId=$conferenceId&domain=$domain&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme',
      },
      { roomId: '!room-id', stateKey: 'jitsi' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          jitsi: {
            container: 'top',
            height: 100,
            index: 0,
            width: 50,
          },
          'widget-id': {
            container: 'top',
            height: 100,
            index: 1,
            width: 50,
          },
        },
      },
      { roomId: '!room-id' }
    );
  });

  it('should update existing jitsi widget and widget layout', async () => {
    widgetApi.mockSendStateEvent({
      content: {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
        },
        id: 'existing-jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'wrong-url',
      },
      event_id: '$event-0',
      origin_server_ts: 0,
      room_id: '!room-id',
      sender: '@user-id',
      state_key: 'existing-jitsi',
      type: 'im.vector.modular.widgets',
    });

    widgetApi.mockSendStateEvent({
      content: { widgets: {} },
      event_id: '$event-1',
      origin_server_ts: 0,
      room_id: '!room-id',
      sender: '@user-id',
      state_key: '',
      type: 'io.element.widgets.layout',
    });

    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomWidgetsApi.endpoints.setupLobbyRoomWidgets.initiate({
          roomId: '!room-id',
        })
      )
      .unwrap();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(2);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
          domain: 'jitsi.riot.im',
          roomName: 'Lobby',
        },
        id: 'existing-jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'https://app.element.io/jitsi.html?confId=EFZG633NFVUWI#conferenceId=$conferenceId&domain=$domain&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme',
      },
      { roomId: '!room-id', stateKey: 'existing-jitsi' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          'existing-jitsi': {
            container: 'top',
            height: 100,
            index: 0,
            width: 50,
          },
          'widget-id': {
            container: 'top',
            height: 100,
            index: 1,
            width: 50,
          },
        },
      },
      { roomId: '!room-id' }
    );
  });
});

describe('setupSessionRoomWidgets', () => {
  it('should setup jitsi widget, barcamp widget, and widget layout', async () => {
    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomWidgetsApi.endpoints.setupSessionRoomWidgets.initiate({
          roomId: '!room-id',
          roomName: 'My Room',
        })
      )
      .unwrap();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(3);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        id: 'barcamp',
        name: 'BarCamp',
        type: 'net.nordeck.barcamp:clock',
        url: 'http://localhost/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language',
      },
      { roomId: '!room-id', stateKey: 'barcamp' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
          domain: 'jitsi.riot.im',
          roomName: 'My Room',
        },
        id: 'jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'https://app.element.io/jitsi.html?confId=EFZG633NFVUWI#conferenceId=$conferenceId&domain=$domain&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme',
      },
      { roomId: '!room-id', stateKey: 'jitsi' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          jitsi: {
            container: 'top',
            height: 100,
            index: 0,
            width: 80,
          },
          barcamp: {
            container: 'top',
            height: 100,
            index: 1,
            width: 20,
          },
        },
      },
      { roomId: '!room-id' }
    );
  });

  it('should setup extra widgets', async () => {
    jest.mocked(getEnvironment).mockImplementation((name, defaultValue) => {
      switch (name) {
        case 'REACT_APP_EXTRA_WIDGETS':
          return JSON.stringify([
            {
              id: 'widget-1',
              type: 'net.nordeck.widget-1:pad',
              name: 'Widget 1',
              url: 'http://1.widget.example',
            },
            {
              id: 'widget-2',
              type: 'net.nordeck.widget-2:pad',
              name: 'Widget 2',
              url: 'http://2.widget.example',
            },
          ]);
        default:
          return defaultValue;
      }
    });

    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomWidgetsApi.endpoints.setupSessionRoomWidgets.initiate({
          roomId: '!room-id',
          roomName: 'My Room',
        })
      )
      .unwrap();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(5);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        id: 'barcamp',
        name: 'BarCamp',
        type: 'net.nordeck.barcamp:clock',
        url: 'http://localhost/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language',
      },
      { roomId: '!room-id', stateKey: 'barcamp' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
          domain: 'jitsi.riot.im',
          roomName: 'My Room',
        },
        id: 'jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'https://app.element.io/jitsi.html?confId=EFZG633NFVUWI#conferenceId=$conferenceId&domain=$domain&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme',
      },
      { roomId: '!room-id', stateKey: 'jitsi' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        id: 'widget-1',
        name: 'Widget 1',
        type: 'net.nordeck.widget-1:pad',
        url: 'http://1.widget.example',
      },
      { roomId: '!room-id', stateKey: 'widget-1' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        id: 'widget-2',
        name: 'Widget 2',
        type: 'net.nordeck.widget-2:pad',
        url: 'http://2.widget.example',
      },
      { roomId: '!room-id', stateKey: 'widget-2' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          jitsi: {
            container: 'top',
            height: 100,
            index: 0,
            width: 50,
          },
          'widget-1': {
            container: 'top',
            height: 100,
            index: 1,
            width: 30,
          },
          barcamp: {
            container: 'top',
            height: 100,
            index: 2,
            width: 20,
          },
        },
      },
      { roomId: '!room-id' }
    );
  });

  it('should update existing jitsi widget, barcamp widget, and widget layout', async () => {
    widgetApi.mockSendStateEvent({
      content: {
        creatorUserId: '@user-id',
        id: 'existing-barcamp',
        name: 'BarCamp',
        type: 'net.nordeck.barcamp:clock',
        url: 'wrong-url',
      },
      event_id: '$event-0',
      origin_server_ts: 0,
      room_id: '!room-id',
      sender: '@user-id',
      state_key: 'existing-barcamp',
      type: 'im.vector.modular.widgets',
    });

    widgetApi.mockSendStateEvent({
      content: {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
        },
        id: 'existing-jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'wrong-url',
      },
      event_id: '$event-0',
      origin_server_ts: 0,
      room_id: '!room-id',
      sender: '@user-id',
      state_key: 'existing-jitsi',
      type: 'im.vector.modular.widgets',
    });

    widgetApi.mockSendStateEvent({
      content: { widgets: {} },
      event_id: '$event-1',
      origin_server_ts: 0,
      room_id: '!room-id',
      sender: '@user-id',
      state_key: '',
      type: 'io.element.widgets.layout',
    });

    const store = createStore({ widgetApi });

    await store
      .dispatch(
        roomWidgetsApi.endpoints.setupSessionRoomWidgets.initiate({
          roomId: '!room-id',
          roomName: 'My Room',
        })
      )
      .unwrap();

    expect(widgetApi.sendStateEvent).toBeCalledTimes(3);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        id: 'existing-barcamp',
        name: 'BarCamp',
        type: 'net.nordeck.barcamp:clock',
        url: 'http://localhost/#/?theme=$org.matrix.msc2873.client_theme&matrix_user_id=$matrix_user_id&matrix_display_name=$matrix_display_name&matrix_avatar_url=$matrix_avatar_url&matrix_room_id=$matrix_room_id&matrix_client_id=$org.matrix.msc2873.client_id&matrix_client_language=$org.matrix.msc2873.client_language',
      },
      { roomId: '!room-id', stateKey: 'existing-barcamp' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      {
        creatorUserId: '@user-id',
        data: {
          conferenceId: 'EFZG633NFVUWI',
          domain: 'jitsi.riot.im',
          roomName: 'My Room',
        },
        id: 'existing-jitsi',
        name: 'Video Conference',
        type: 'jitsi',
        url: 'https://app.element.io/jitsi.html?confId=EFZG633NFVUWI#conferenceId=$conferenceId&domain=$domain&displayName=$matrix_display_name&avatarUrl=$matrix_avatar_url&userId=$matrix_user_id&roomId=$matrix_room_id&roomName=$roomName&theme=$theme',
      },
      { roomId: '!room-id', stateKey: 'existing-jitsi' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          'existing-jitsi': {
            container: 'top',
            height: 100,
            index: 0,
            width: 80,
          },
          'existing-barcamp': {
            container: 'top',
            height: 100,
            index: 1,
            width: 20,
          },
        },
      },
      { roomId: '!room-id' }
    );
  });
});

describe('getExtraWidgetsWidgets', () => {
  it('should accept configuration', () => {
    jest.mocked(getEnvironment).mockImplementation((name, defaultValue) => {
      switch (name) {
        case 'REACT_APP_EXTRA_WIDGETS':
          return JSON.stringify([
            {
              id: 'widget-1',
              type: 'net.nordeck.widget-1:pad',
              name: 'Widget 1',
              url: 'http://1.widget.example',
            },
          ]);
        default:
          return defaultValue;
      }
    });

    expect(getExtraWidgetsWidgets('@user-id')).toEqual([
      {
        creatorUserId: '@user-id',
        id: 'widget-1',
        type: 'net.nordeck.widget-1:pad',
        name: 'Widget 1',
        url: 'http://1.widget.example',
      },
    ]);
  });

  it('should accept additional properties', () => {
    jest.mocked(getEnvironment).mockImplementation((name, defaultValue) => {
      switch (name) {
        case 'REACT_APP_EXTRA_WIDGETS':
          return JSON.stringify([
            {
              id: 'widget-1',
              type: 'net.nordeck.widget-1:pad',
              name: 'Widget 1',
              url: 'http://1.widget.example',
              additional: 'tmp',
            },
          ]);
        default:
          return defaultValue;
      }
    });

    expect(getExtraWidgetsWidgets('@user-id')).toEqual([
      {
        creatorUserId: '@user-id',
        id: 'widget-1',
        type: 'net.nordeck.widget-1:pad',
        name: 'Widget 1',
        url: 'http://1.widget.example',
      },
    ]);
  });

  it.each<Object>([
    { id: undefined },
    { id: null },
    { id: 111 },
    { name: undefined },
    { name: null },
    { name: 111 },
    { type: undefined },
    { type: null },
    { type: 111 },
    { url: undefined },
    { url: null },
    { url: 111 },
    { url: 'no-uri' },
  ])('should reject event with patch %j', (patch: Object) => {
    jest.mocked(getEnvironment).mockImplementation((name, defaultValue) => {
      switch (name) {
        case 'REACT_APP_EXTRA_WIDGETS':
          return JSON.stringify([
            {
              id: 'widget-1',
              type: 'net.nordeck.widget-1:pad',
              name: 'Widget 1',
              url: 'http://1.widget.example',
              ...patch,
            },
          ]);
        default:
          return defaultValue;
      }
    });

    expect(getExtraWidgetsWidgets('@user-id')).toEqual([]);
  });
});
