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
  mockSessionGrid,
  mockSessionGridStart,
  mockTopicSubmission,
} from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { useAvailableTopicSubmissions } from './useAvailableTopicSubmissions';

describe('useAvailableTopicSubmissions', () => {
  let widgetApi: MockedWidgetApi;
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        <StoreProvider>{children}</StoreProvider>
      </WidgetApiMockProvider>
    );
  });

  it('should get available topics', async () => {
    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendRoomEvent(mockSessionGridStart());
    widgetApi.mockSendStateEvent(mockSessionGrid());
    widgetApi.mockSendRoomEvent(mockTopicSubmission());

    const { result, waitForNextUpdate } = renderHook(
      useAvailableTopicSubmissions,
      { wrapper }
    );

    expect(result.current).toEqual({
      isLoading: true,
    });

    await waitForNextUpdate();

    expect(result.current).toEqual({
      data: [
        expect.objectContaining({
          content: {
            title: 'My topic',
            description: 'I would like to talk about…',
            'm.relates_to': {
              rel_type: 'm.reference',
              event_id: '$start-event-id',
            },
          },
        }),
      ],
      isLoading: false,
    });
  });

  it('should provide loading state', async () => {
    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(mockSessionGrid());
    widgetApi.readEventRelations.mockImplementation(
      () => new Promise(() => {})
    );

    const { result, waitForNextUpdate } = renderHook(
      useAvailableTopicSubmissions,
      { wrapper }
    );

    expect(result.current).toEqual({
      isLoading: true,
    });

    await waitForNextUpdate();

    expect(result.current).toEqual({
      isLoading: true,
    });
  });

  it('should forward error state', async () => {
    widgetApi.receiveRoomEvents.mockRejectedValue(new Error());

    const { result, waitForNextUpdate } = renderHook(
      useAvailableTopicSubmissions,
      { wrapper }
    );

    expect(result.current).toEqual({
      isLoading: true,
    });

    await waitForNextUpdate();

    expect(result.current).toEqual({
      isLoading: false,
      error: {
        name: 'LoadFailed',
        message: expect.stringMatching(/could not load topic submissions/i),
      },
    });
  });
});
