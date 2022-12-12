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

import { render, screen, within } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { CommonEventTimeSlot, Track } from '../../lib/events';
import { CommonEventSlot } from './CommonEventSlot';
import { EditModeProvider } from './EditModeContext';

const wrapper = ({ children }: PropsWithChildren<{}>) => (
  <table>
    <tbody>
      <tr>{children}</tr>
    </tbody>
  </table>
);

describe('<CommonEventSlot>', () => {
  let timeSlot: CommonEventTimeSlot;
  let tracks: Track[];

  beforeEach(() => {
    timeSlot = {
      id: 'timeslot-0',
      type: 'common-event',
      startTime: '2022-02-28T09:00:00Z',
      endTime: '2022-02-28T12:00:00Z',
      summary: 'Common Event',
      icon: 'coffee',
    };
    tracks = [
      {
        id: 'track-0',
        name: 'Track 0',
        icon: 'star',
      },
    ];
  });

  it('should render without exploding', () => {
    render(
      <EditModeProvider>
        <CommonEventSlot
          timeSlot={timeSlot}
          tracks={tracks}
          onChange={() => {}}
        />
      </EditModeProvider>,
      { wrapper }
    );

    const cell = screen.getByRole('cell', { name: /common event/i });

    expect(
      within(cell).getByRole('img', { name: 'Icon "coffee"' })
    ).toBeInTheDocument();
    expect(within(cell).getByText(/common event/i)).toBeInTheDocument();
  });

  it('should make event title and icon editable', () => {
    render(
      <EditModeProvider enableEdit>
        <CommonEventSlot
          timeSlot={timeSlot}
          tracks={tracks}
          onChange={() => {}}
        />
      </EditModeProvider>,
      { wrapper }
    );

    expect(
      screen.getByRole('textbox', { name: /common event title/i })
    ).toHaveValue('Common Event');
    expect(
      screen.getByRole('combobox', { name: 'Icon "coffee"' })
    ).toBeInTheDocument();
  });
});
