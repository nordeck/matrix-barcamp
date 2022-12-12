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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { renderHook } from '@testing-library/react-hooks';
import { ComponentType, PropsWithChildren } from 'react';
import {
  mockInitializeSpaceParent,
  mockParticipantPowerLevelsEvent,
  mockPowerLevelsEvent,
} from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { usePowerLevels } from './usePowerLevels';

let widgetApi: MockedWidgetApi;
let wrapper: ComponentType<PropsWithChildren<{}>>;

afterEach(() => widgetApi.stop());

beforeEach(() => {
  widgetApi = mockWidgetApi();

  mockInitializeSpaceParent(widgetApi);

  wrapper = ({ children }: PropsWithChildren<{}>) => (
    <WidgetApiMockProvider value={widgetApi}>
      <StoreProvider>{children}</StoreProvider>
    </WidgetApiMockProvider>
  );
});

describe('usePowerLevels', () => {
  it('should have participants power by default (undefined)', () => {
    const { result } = renderHook(usePowerLevels, { wrapper });

    expect(result.current).toEqual({
      canModerate: undefined,
      canSubmitTopic: undefined,
      canParticipantsSubmitTopics: undefined,
    });
  });

  it('should have participants power if not all events can be emitted', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic': 0,
            'net.nordeck.barcamp.session_grid': 0,
            'net.nordeck.barcamp.linked_room': 50,
          },
        },
        room_id: '!space-id',
      })
    );

    const { result, waitForNextUpdate } = renderHook(usePowerLevels, {
      wrapper,
    });

    expect(result.current).toMatchObject({ canModerate: undefined });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({ canModerate: false });
  });

  it('should have moderator power if all events can be emitted', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic': 0,
            'net.nordeck.barcamp.session_grid': 0,
            'net.nordeck.barcamp.linked_room': 0,
          },
        },
        room_id: '!space-id',
      })
    );

    const { result, waitForNextUpdate } = renderHook(usePowerLevels, {
      wrapper,
    });

    expect(result.current).toMatchObject({ canModerate: undefined });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({ canModerate: true });
  });

  it('should deny submissions for current user if power level is insufficient', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
      })
    );

    const { result, waitForNextUpdate } = renderHook(usePowerLevels, {
      wrapper,
    });

    expect(result.current).toMatchObject({ canSubmitTopic: undefined });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({ canSubmitTopic: false });
  });

  it('should allow submissions for current user if power level is sufficient', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        },
      })
    );

    const { result, waitForNextUpdate } = renderHook(usePowerLevels, {
      wrapper,
    });

    expect(result.current).toMatchObject({ canSubmitTopic: undefined });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({ canSubmitTopic: true });
  });

  it('should deny submissions for participants if power level is insufficient', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
        room_id: '!room-id',
      })
    );

    const { result, waitForNextUpdate } = renderHook(usePowerLevels, {
      wrapper,
    });

    expect(result.current).toMatchObject({
      canParticipantsSubmitTopics: undefined,
    });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({
      canParticipantsSubmitTopics: false,
    });
  });

  it('should allow submissions for participants if power level is sufficient', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        },
        room_id: '!room-id',
      })
    );

    const { result, waitForNextUpdate } = renderHook(usePowerLevels, {
      wrapper,
    });

    expect(result.current).toMatchObject({
      canParticipantsSubmitTopics: undefined,
    });

    await waitForNextUpdate();

    expect(result.current).toMatchObject({ canParticipantsSubmitTopics: true });
  });
});
