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
  ThemeSelectionProvider,
  WidgetApiMockProvider,
} from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import { ParkingLotEntry } from '../../lib/events';
import {
  mockInitializeSpaceParent,
  mockParticipantPowerLevelsEvent,
  mockTopic,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { DragAndDropProvider } from '../DragAndDropProvider';
import { NotificationsProvider } from '../NotificationsProvider';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { ParkingLot } from './ParkingLot';

describe('<ParkingLot>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let parkingLotTopics: ParkingLotEntry[];
  let widgetApi: MockedWidgetApi;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'waiting-room-topic-0',
        content: {
          title: 'New Information',
          authors: [{ id: '@klaus-durchdenwald' }],
          description:
            'Are there any new metrics, trends, customer feedback, or market influences we should be aware of?',
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'waiting-room-topic-1',
        content: {
          title: 'Upcoming Priorities',
          authors: [{ id: '@guenter-nachtnebel' }],
          description:
            'What are the main priorities we should focus on for next week?',
        },
      })
    );

    parkingLotTopics = [
      { topicId: 'waiting-room-topic-0' },
      { topicId: 'waiting-room-topic-1' },
    ];

    wrapper = ({ children }: PropsWithChildren<{}>) => {
      return (
        <NotificationsProvider>
          <WidgetApiMockProvider value={widgetApi}>
            <StoreProvider>
              <ThemeSelectionProvider>
                <StyledComponentsThemeProvider>
                  <DragAndDropProvider>{children}</DragAndDropProvider>
                </StyledComponentsThemeProvider>
              </ThemeSelectionProvider>
            </StoreProvider>
          </WidgetApiMockProvider>
        </NotificationsProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(<ParkingLot topics={[]} />, { wrapper });

    expect(
      screen.getByText(
        /You can park topics here that you don't want to place in the grid for now/
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/no suggestions/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit a topic/i })
    ).toBeInTheDocument();
  });

  it('should render the topics', async () => {
    render(<ParkingLot topics={parkingLotTopics} />, { wrapper });

    await expect(
      screen.findByText(/New Information/)
    ).resolves.toBeInTheDocument();
    expect(screen.getByText(/durchdenwald/)).toBeInTheDocument();
    expect(screen.getByText(/Are there any new metrics/)).toBeInTheDocument();

    expect(screen.getByText(/Upcoming Priorities/)).toBeInTheDocument();
    expect(screen.getByText(/nachtnebel/)).toBeInTheDocument();
    expect(
      screen.getByText(/What are the main priorities/)
    ).toBeInTheDocument();
  });

  it('should make topics editable for moderators', async () => {
    render(<ParkingLot topics={parkingLotTopics} />, { wrapper });

    const topic = await screen.findByRole('button', {
      name: /New Information/,
    });

    await userEvent.click(
      within(topic).getByRole('button', { name: /show details/i })
    );

    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByRole('button', { name: /delete topic/i })
    ).toBeInTheDocument();
  });

  it('should make topics read-only for participants', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: '!room-id' })
    );

    render(<ParkingLot topics={parkingLotTopics.slice(0, 1)} />, { wrapper });

    await userEvent.click(
      await screen.findByRole('button', { name: /show details/i })
    );

    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByRole('button', { name: /delete topic/i })
    ).not.toBeInTheDocument();
  });
});
