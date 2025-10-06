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
import { mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, within } from '@testing-library/react';
import { ComponentType, PropsWithChildren } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Session, TimeSlot, Track } from '../../lib/events';
import { StoreProvider } from '../../store';
import {
  DragAndDropProvider,
  stringifyDroppableId,
} from '../DragAndDropProvider';
import { EditModeProvider } from './EditModeContext';
import { TimeSlotRow } from './TimeSlotRow';

describe('<TimeSlotRow>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let timeSlot: TimeSlot;
  let tracks: Track[];
  let sessions: Session[];

  beforeEach(() => {
    timeSlot = {
      id: 'timeslot-0',
      type: 'sessions',
      startTime: '2022-02-28T09:00:00Z',
      endTime: '2022-02-28T10:30:00Z',
    };
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

    const widgetApi = mockWidgetApi();

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        <StoreProvider>
          <DragAndDropProvider>
            <EditModeProvider>
              <table>
                {/* @ts-ignore - react-beautiful-dnd JSX component type issue */}
                <Droppable
                  type="timeSlot"
                  droppableId={stringifyDroppableId({ type: 'timeSlot' })}
                >
                  {(provided) => (
                    <tbody {...provided.droppableProps} ref={provided.innerRef}>
                      {children}
                    </tbody>
                  )}
                </Droppable>
              </table>
            </EditModeProvider>
          </DragAndDropProvider>
        </StoreProvider>
      </WidgetApiMockProvider>
    );
  });

  it('should render start time and duration', () => {
    render(
      <TimeSlotRow
        index={0}
        tracks={tracks}
        timeSlot={timeSlot}
        sessions={[]}
        onCommonEventChange={() => {}}
        onTopicChange={() => {}}
        onDeleteTopic={() => {}}
        onTimeSlotChange={() => {}}
      />,
      { wrapper }
    );

    expect(
      screen.getByRole('rowheader', { name: /9:00 am 90 min/i })
    ).toBeInTheDocument();
  });

  it('should render a session slot for each track', () => {
    render(
      <TimeSlotRow
        index={0}
        tracks={tracks}
        timeSlot={timeSlot}
        sessions={[]}
        onCommonEventChange={() => {}}
        onTopicChange={() => {}}
        onDeleteTopic={() => {}}
        onTimeSlotChange={() => {}}
      />,
      { wrapper }
    );

    const rowEl = screen.getByRole('row', { name: /9:00 am/i });

    expect(
      within(rowEl)
        .getAllByRole('cell')
        .map((el) => el.textContent)
    ).toEqual(['', '']);
  });

  it('should render a common event', () => {
    timeSlot = {
      id: 'timeslot-0',
      startTime: '2022-02-28T09:00:00Z',
      endTime: '2022-02-28T10:30:00Z',
      type: 'common-event',
      summary: 'Common Event',
      icon: 'icon',
    };

    render(
      <TimeSlotRow
        index={0}
        tracks={tracks}
        timeSlot={timeSlot}
        sessions={sessions}
        onCommonEventChange={() => {}}
        onTopicChange={() => {}}
        onDeleteTopic={() => {}}
        onTimeSlotChange={() => {}}
      />,
      { wrapper }
    );

    const rowEl = screen.getByRole('row', { name: /9:00 am/i });
    expect(
      within(rowEl).getByRole('cell', { name: /common event/i })
    ).toBeInTheDocument();

    expect(
      within(rowEl)
        .getAllByRole('cell')
        .map((el) => el.textContent)
    ).toEqual([expect.stringMatching(/common event/i)]);
  });
});
