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
import { mockInitializeSpaceParent, mockSpaceChild } from '../../lib/testUtils';
import { StoreProvider } from '../StoreProvider';
import { useRoomNavigation } from './useRoomNavigation';

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

describe.skip('navigateToRoom', () => {
  it('should navigate to the room', async () => {
    mockInitializeSpaceParent(widgetApi);

    const { result } = renderHook(useRoomNavigation, { wrapper });

    await expect(
      result.current.navigateToRoom('!room-id')
    ).resolves.toBeUndefined();

    expect(widgetApi.navigateTo).toBeCalledWith('https://matrix.to/#/!room-id');
  });

  it('should navigate to the room with via from the space child event', async () => {
    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(mockSpaceChild());

    const { result, waitForNextUpdate } = renderHook(useRoomNavigation, {
      wrapper,
    });

    // wait until the space was loaded
    await waitForNextUpdate();

    await expect(
      result.current.navigateToRoom('!room-id')
    ).resolves.toBeUndefined();

    expect(widgetApi.navigateTo).toBeCalledWith(
      'https://matrix.to/#/!room-id?via=matrix.to'
    );
  });
});
