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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Track } from '../../lib/events';
import { DeleteTrackButton } from './DeleteTrackButton';

describe('<DeleteTrackButton>', () => {
  let track: Track;

  beforeEach(() => {
    track = {
      name: 'My Room',
      icon: 'crow',
      id: 'track-0',
    };
  });

  it('should delete the track if the user confirms', async () => {
    const onDelete = jest.fn();

    render(<DeleteTrackButton track={track} onDelete={onDelete} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete track' }),
      {
        skipHover: true,
      }
    );

    const modal = screen.getByRole('dialog', { name: 'Delete the track?' });
    expect(modal).toHaveAccessibleDescription(
      'Do you want to delete the track “My Room”? The topics that are currently assigned to this track, if any, will be moved to the parking lot.'
    );
    expect(within(modal).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await userEvent.click(
      within(modal).getByRole('button', { name: 'Delete' })
    );

    expect(modal).not.toBeInTheDocument();

    expect(onDelete).toHaveBeenCalled();
  });

  it('should do nothing if the user cancels the deletion', async () => {
    const onDelete = jest.fn();

    render(<DeleteTrackButton track={track} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete track' });

    await userEvent.click(deleteButton, { skipHover: true });

    const modal = screen.getByRole('dialog', { name: 'Delete the track?' });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(modal).not.toBeInTheDocument();
    await waitFor(() => expect(deleteButton).toHaveFocus());

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should disable delete if no callback is passed', () => {
    render(<DeleteTrackButton track={track} />);

    expect(screen.getByRole('button', { name: 'Delete track' })).toBeDisabled();
  });
});
