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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import {
  mockInitializeSpaceParent,
  mockPowerLevelsEvent,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { NotificationsProvider } from '../NotificationsProvider';
import { PersonalSpace } from './PersonalSpace';

describe('<PersonalSpace/>', () => {
  let widgetApi: MockedWidgetApi;
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({ room_id: '!space-id' })
    );

    wrapper = ({ children }) => {
      return (
        <NotificationsProvider>
          <WidgetApiMockProvider value={widgetApi}>
            <StoreProvider>{children}</StoreProvider>
          </WidgetApiMockProvider>
        </NotificationsProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(<PersonalSpace />, { wrapper });

    expect(
      screen.getByRole('button', { name: /submit a topic/i })
    ).toBeInTheDocument();
  });

  it('should show modal dialog', async () => {
    render(<PersonalSpace />, { wrapper });

    await userEvent.click(
      screen.getByRole('button', { name: /submit a topic/i })
    );

    const dialog = screen.getByRole('dialog', { name: /personal space/i });

    expect(within(dialog).getByText(/personal space/i)).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /create new topic/i })
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole('button', { name: /close/i })
    );

    expect(dialog).not.toBeInTheDocument();
  });

  it('should set focus to modal dialog', async () => {
    render(<PersonalSpace />, { wrapper });

    const submitButton = screen.getByRole('button', {
      name: /submit a topic/i,
    });

    await userEvent.click(submitButton);

    const dialog = screen.getByRole('dialog', { name: /personal space/i });
    const closeButton = within(dialog).getByRole('button', { name: /close/i });

    expect(closeButton).toHaveFocus();

    await userEvent.click(closeButton);

    await waitFor(() => expect(submitButton).toHaveFocus());
  });

  it('should allow moderators to open submissions', async () => {
    render(<PersonalSpace />, { wrapper });

    await userEvent.click(
      await screen.findByRole('button', { name: /open topic submission/i })
    );

    await waitFor(() => {
      expect(widgetApi.sendStateEvent).toBeCalledWith(
        'm.room.power_levels',
        expect.objectContaining({
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        }),
        { room_id: undefined }
      );
    });
  });

  it('should allow moderators to close submissions', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        },
      })
    );

    render(<PersonalSpace />, { wrapper });

    await userEvent.click(
      await screen.findByRole('button', { name: /close topic submission/i })
    );

    await waitFor(() => {
      expect(widgetApi.sendStateEvent).toBeCalledWith(
        'm.room.power_levels',
        expect.objectContaining({
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        }),
        { room_id: undefined }
      );
    });
  });

  it('should display notification if submission is opened', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
      })
    );

    render(<PersonalSpace />, { wrapper });

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        },
      })
    );

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
      /Topic submission was opened/
    );
  });

  it('should display notification if submission is closed', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        },
      })
    );

    render(<PersonalSpace />, { wrapper });

    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
      })
    );

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent(
      /Topic submission was closed/
    );
  });
});
