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
import { TimeSlot, Track } from '../../lib/events';
import {
  mockInitializeSpaceParent,
  mockParticipantPowerLevelsEvent,
  mockTopic,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { DragAndDropProvider } from '../DragAndDropProvider';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { SessionSlot } from './SessionSlot';

describe('<SessionSlot>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let widgetApi: MockedWidgetApi;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'topic-0',
        content: {
          title: 'Team Review',
          authors: [{ id: '@juergen-vormelker' }],
          description:
            'We share updates on overall progress, key metrics, and anecdotes to give our team an up-to-date understanding of current initiatives.',
        },
      })
    );

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        <StoreProvider>
          <ThemeSelectionProvider>
            <StyledComponentsThemeProvider>
              <DragAndDropProvider>
                <table>
                  <tbody>
                    <tr>{children}</tr>
                  </tbody>
                </table>
              </DragAndDropProvider>
            </StyledComponentsThemeProvider>
          </ThemeSelectionProvider>
        </StoreProvider>
      </WidgetApiMockProvider>
    );
  });

  const track: Track = {
    id: 'track-0',
    icon: 'icon',
    name: 'Track 0',
  };

  const timeSlot: TimeSlot = {
    id: 'timeslot-0',
    type: 'sessions',
    startTime: '2022-02-28T09:00:00Z',
    endTime: '2022-02-28T12:00:00Z',
  };

  it('should render an empty slot', () => {
    render(
      <SessionSlot
        track={track}
        timeSlot={timeSlot}
        topicId={undefined}
        onDeleteTopic={() => {}}
        onTopicChange={() => {}}
      />,
      { wrapper }
    );

    expect(screen.getByRole('cell', { name: '' })).toBeInTheDocument();
  });

  it('should render the topic', async () => {
    render(
      <SessionSlot
        track={track}
        timeSlot={timeSlot}
        topicId={'topic-0'}
        onDeleteTopic={() => {}}
        onTopicChange={() => {}}
      />,
      { wrapper }
    );

    await expect(
      screen.findByRole('cell', { name: /Team Review/i })
    ).resolves.toBeInTheDocument();
  });

  it('should make topics editable for moderators', async () => {
    render(
      <SessionSlot
        track={track}
        timeSlot={timeSlot}
        topicId={'topic-0'}
        onDeleteTopic={() => {}}
        onTopicChange={() => {}}
      />,
      { wrapper }
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /show details/i })
    );

    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByRole('button', { name: /delete topic/i })
    ).toBeInTheDocument();
  });

  it('should make topics read only for participants', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: '!space-id' })
    );

    render(
      <SessionSlot
        track={track}
        timeSlot={timeSlot}
        topicId={'topic-0'}
        onDeleteTopic={() => {}}
        onTopicChange={() => {}}
      />,
      { wrapper }
    );

    await userEvent.click(
      await screen.findByRole('button', { name: /show details/i })
    );

    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByRole('button', { name: /delete topic/i })
    ).not.toBeInTheDocument();
  });
});
