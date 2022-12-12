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

import { render, screen } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { TimeSlot, Track } from '../../lib/events';
import { EditModeProvider } from './EditModeContext';
import { EndTimeRow } from './EndTimeRow';

const wrapper = ({ children }: PropsWithChildren<{}>) => (
  <EditModeProvider>
    <table>
      <tbody>{children}</tbody>
    </table>
  </EditModeProvider>
);

describe('<EndTimeRow>', () => {
  it('should show the end time of the last time slot of the barcamp', () => {
    const timeSlots: TimeSlot[] = [
      {
        id: 'timeslot-0',
        type: 'sessions',
        startTime: '2022-02-28T09:00:00Z',
        endTime: '2022-02-28T12:00:00Z',
      },
      {
        id: 'timeslot-1',
        type: 'sessions',
        startTime: '2022-02-28T12:00:00Z',
        endTime: '2022-02-28T18:00:00Z',
      },
    ];
    const tracks: Track[] = [
      {
        id: 'track-0',
        name: 'Track 0',
        icon: 'icon',
      },
    ];

    render(<EndTimeRow timeSlots={timeSlots} tracks={tracks} />, { wrapper });

    expect(
      screen.getByRole('rowheader', { name: /6:00 pm/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: /end of the barcamp/i })
    ).toBeInTheDocument();
  });
});
