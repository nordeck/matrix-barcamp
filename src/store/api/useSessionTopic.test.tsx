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
  mockLinkedRoom,
  mockSessionGrid,
} from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { useSessionTopic } from './useSessionTopic';

let widgetApi: MockedWidgetApi;
let wrapper: ComponentType<PropsWithChildren<{}>>;

afterEach(() => widgetApi.stop());

beforeEach(() => {
  widgetApi = mockWidgetApi();

  mockInitializeSpaceParent(widgetApi);
  mockInitializeSpaceParent(widgetApi, { room_id: 'lobby-room-id' });

  wrapper = ({ children }: PropsWithChildren<{}>) => (
    <WidgetApiMockProvider value={widgetApi}>
      <StoreProvider>{children}</StoreProvider>
    </WidgetApiMockProvider>
  );
});

describe('useSessionTopic', () => {
  it('should return no session while loading', async () => {
    widgetApi.mockSendStateEvent(mockSessionGrid());

    const { result } = renderHook(useSessionTopic, {
      wrapper,
    });

    expect(result.current).toEqual({ session: undefined });
  });

  it('should return no session in lobby room', async () => {
    widgetApi.mockSendStateEvent(mockSessionGrid());

    const { result, waitForNextUpdate } = renderHook(useSessionTopic, {
      wrapper,
    });

    expect(result.current).toEqual({ session: undefined });

    await waitForNextUpdate();

    expect(result.current).toEqual({ session: undefined });
  });

  it.skip('should return session in linked room', async () => {
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        state_key: 'lobby-room-id',
        content: {
          sessions: [
            {
              topicId: 'topic-0',
              timeSlotId: 'timeslot-0',
              trackId: 'track-0',
            },
          ],
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockLinkedRoom({
        state_key: '!room-id',
        content: { sessionGridId: 'lobby-room-id' },
      })
    );

    const { result, waitForNextUpdate } = renderHook(useSessionTopic, {
      wrapper,
    });

    expect(result.current).toEqual({ session: undefined });

    await waitForNextUpdate();

    expect(result.current).toEqual({
      session: {
        topicId: 'topic-0',
        timeSlotId: 'timeslot-0',
        trackId: 'track-0',
      },
    });
  });

  it('should return no session in unrelated room', async () => {
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        state_key: 'lobby-room-id',
        content: {
          sessions: [
            {
              topicId: 'topic-0',
              timeSlotId: 'timeslot-0',
              trackId: 'track-0',
            },
          ],
        },
      })
    );

    const { result, waitForNextUpdate } = renderHook(useSessionTopic, {
      wrapper,
    });

    expect(result.current).toEqual({ session: undefined });

    await waitForNextUpdate();

    expect(result.current).toEqual({ session: undefined });
  });
});
