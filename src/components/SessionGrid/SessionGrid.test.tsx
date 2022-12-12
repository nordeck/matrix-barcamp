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
import { ComponentType, PropsWithChildren } from 'react';
import { Session, TimeSlot, Track } from '../../lib/events';
import {
  mockInitializeSpaceParent,
  mockParticipantPowerLevelsEvent,
  mockTopic,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { DragAndDropProvider } from '../DragAndDropProvider';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { SessionGrid } from './SessionGrid';

describe('<SessionGrid>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let timeSlots: TimeSlot[];
  let tracks: Track[];
  let sessions: Session[] = [];
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
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'topic-1',
        content: {
          title: 'Individual Updates',
          authors: [{ id: '@karl-handschuh' }],
          description:
            "We allow each team member to briefly share what they've been working on. This includes progress, obstacles, achievements, and any other information that would be valuable for the team.",
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'topic-2',
        content: {
          title: 'Positive Highlights',
          authors: [{ id: '@walter-trinkenschuh' }],
          description:
            'We acknowledge big wins and milestones accomplished since the last weekly meeting. What valuable lessons were learned?',
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'topic-3',
        content: {
          title: 'Individual Updates',
          authors: [{ id: '@karl-handschuh' }],
          description:
            'Have any issues or challenges come up since the last weekly meeting? Are there any particular problems a team member is stuck on? How can we help solve them?',
        },
      })
    );

    timeSlots = [
      {
        id: 'timeslot-0',
        type: 'sessions',
        startTime: '2022-02-28T09:00:00Z',
        endTime: '2022-02-28T10:30:00Z',
      },
      {
        id: 'timeslot-1',
        type: 'sessions',
        startTime: '2022-02-28T10:30:00Z',
        endTime: '2022-02-28T12:00:00Z',
      },
      {
        id: 'timeslot-2-break',
        startTime: '2022-02-28T12:00:00Z',
        endTime: '2022-02-28T13:30:00Z',
        type: 'common-event',
        summary: 'Common Event',
        icon: 'icon',
      },
    ];
    tracks = [
      {
        id: 'track-0',
        name: 'Track 0',
        icon: 'icon-0',
      },
      {
        id: 'track-1',
        name: 'Track 1',
        icon: 'icon-1',
      },
    ];
    sessions = [
      {
        topicId: 'topic-0',
        trackId: 'track-0',
        timeSlotId: 'timeslot-0',
      },
      {
        topicId: 'topic-1',
        trackId: 'track-0',
        timeSlotId: 'timeslot-1',
      },
      {
        topicId: 'topic-2',
        trackId: 'track-1',
        timeSlotId: 'timeslot-1',
      },
      {
        topicId: 'topic-3',
        trackId: 'track-0',
        timeSlotId: 'timeslot-3',
      },
    ];

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        <StoreProvider>
          <ThemeSelectionProvider>
            <StyledComponentsThemeProvider>
              <DragAndDropProvider>{children}</DragAndDropProvider>
            </StyledComponentsThemeProvider>
          </ThemeSelectionProvider>
        </StoreProvider>
      </WidgetApiMockProvider>
    );
  });

  it('should render time slots and tracks', async () => {
    render(
      <SessionGrid timeSlots={timeSlots} tracks={tracks} sessions={sessions} />,
      { wrapper }
    );

    expect(
      screen.getByRole('columnheader', { name: /track 0/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /track 1/i })
    ).toBeInTheDocument();

    const row0 = screen.getByRole('row', { name: /9:00 am/i });

    expect(
      within(row0).getByRole('rowheader', { name: /9:00 am/i })
    ).toBeInTheDocument();

    await expect(
      within(row0).findByRole('cell', { name: /^team review/i })
    ).resolves.toBeInTheDocument();

    const row1 = screen.getByRole('row', { name: /10:30 am/i });

    expect(
      within(row1).getByRole('rowheader', { name: /10:30 am/i })
    ).toBeInTheDocument();

    expect(
      within(row1)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual([
      expect.stringMatching(/individual updates/i),
      expect.stringMatching(/positive highlights/i),
    ]);

    const row2 = screen.getByRole('row', { name: /12:00 pm/i });

    expect(
      within(row2).getByRole('rowheader', { name: /12:00 pm/i })
    ).toBeInTheDocument();

    expect(
      within(row2)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual([expect.stringMatching(/^common event/i)]);

    const row3 = screen.getByRole('row', { name: /1:30 pm/i });

    expect(
      within(row3).getByRole('rowheader', { name: /1:30 pm/i })
    ).toBeInTheDocument();

    expect(
      within(row3)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual([expect.stringMatching(/^end of the barcamp/i)]);
  });

  // TODO: Test empty state

  it('should provide edit mode switcher for moderators', async () => {
    render(
      <SessionGrid timeSlots={timeSlots} tracks={tracks} sessions={sessions} />,
      { wrapper }
    );

    await expect(
      screen.findByRole('button', { name: /edit tracks and time slots/i })
    ).resolves.toBeInTheDocument();
  });

  it('should not provide edit mode switcher for participants', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: '!space-id' })
    );

    render(
      <SessionGrid timeSlots={timeSlots} tracks={tracks} sessions={sessions} />,
      { wrapper }
    );

    expect(
      screen.queryByRole('button', { name: /edit rooms and time slots/i })
    ).not.toBeInTheDocument();
  });
});
