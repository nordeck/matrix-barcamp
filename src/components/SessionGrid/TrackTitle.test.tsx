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
import { Track } from '../../lib/events';
import { EditModeProvider } from './EditModeContext';
import { TrackTitle } from './TrackTitle';

const wrapper = ({ children }: PropsWithChildren<{}>) => (
  <table>
    <thead>
      <tr>{children}</tr>
    </thead>
  </table>
);

describe('<TrackTitle>', () => {
  let track: Track;

  beforeEach(() => {
    track = {
      id: 'track-0',
      icon: 'frog',
      name: 'Track 0',
    };
  });

  it('should render without exploding', () => {
    render(
      <EditModeProvider>
        <TrackTitle track={track} onChange={() => {}} />
      </EditModeProvider>,
      { wrapper }
    );

    const header = screen.getByRole('columnheader', { name: /track 0/i });

    expect(within(header).getByText('Track 0')).toBeInTheDocument();
    expect(
      within(header).getByRole('img', { name: 'Icon "frog"' })
    ).toBeInTheDocument();
  });

  it('should show delete button in the edit mode', () => {
    render(
      <EditModeProvider enableEdit>
        <TrackTitle track={track} onChange={() => {}} />
      </EditModeProvider>,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should make the title editable when in the edit mode', () => {
    render(
      <EditModeProvider enableEdit>
        <TrackTitle track={track} onChange={() => {}} />
      </EditModeProvider>,
      { wrapper }
    );

    expect(screen.getByRole('textbox', { name: 'Track name' })).toHaveValue(
      'Track 0'
    );
  });

  it('should make the icon editable when in the edit mode', () => {
    render(
      <EditModeProvider enableEdit>
        <TrackTitle track={track} onChange={() => {}} />
      </EditModeProvider>,
      { wrapper }
    );

    expect(
      screen.getByRole('combobox', { name: 'Icon "frog"' })
    ).toBeInTheDocument();
  });
});
