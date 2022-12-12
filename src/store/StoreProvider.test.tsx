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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import { mockInitializeSpaceParent, mockSessionGrid } from '../lib/testUtils';
import { useAddTrackMutation } from './api';
import { sessionGridApi } from './api/sessionGridApi';
import { StoreProvider } from './StoreProvider';

describe('<StoreProvider/>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let widgetApi: MockedWidgetApi;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();
    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(mockSessionGrid());

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        {children}
      </WidgetApiMockProvider>
    );
  });

  it('should emit errors', async () => {
    const Component = () => {
      const [addTrack] = useAddTrackMutation();

      return <button onClick={() => addTrack()}>Add Track</button>;
    };
    const onError = jest.fn();
    render(
      <StoreProvider onError={onError}>
        <Component />
      </StoreProvider>,
      { wrapper }
    );

    widgetApi.sendStateEvent.mockRejectedValueOnce(new Error());

    await userEvent.click(screen.getByRole('button'));

    expect(onError).toBeCalled();
    expect(
      sessionGridApi.endpoints.addTrack.matchRejected(onError.mock.calls[0][0])
    ).toBe(true);
  });
});
