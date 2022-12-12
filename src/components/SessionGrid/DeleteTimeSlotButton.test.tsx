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
import { TimeSlot } from '../../lib/events';
import { DeleteTimeSlotButton } from './DeleteTimeSlotButton';

describe('<DeleteTimeSlotButton>', () => {
  let timeSlot: TimeSlot;

  beforeEach(() => {
    timeSlot = {
      id: 'timeSlot-0',
      type: 'sessions',
      startTime: '2022-02-28T09:30:00Z',
      endTime: '2022-02-28T10:30:00Z',
    };
  });

  it('should delete the time slot if the user confirms', async () => {
    const onDelete = jest.fn();

    render(<DeleteTimeSlotButton timeSlot={timeSlot} onDelete={onDelete} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete time slot' }),
      { skipHover: true }
    );

    const modal = screen.getByRole('dialog', { name: 'Delete the time slot?' });
    expect(modal).toHaveAccessibleDescription(
      'Do you want to delete the time slot at 9:30 AM? The topics that are currently assigned to this time slot, if any, will be moved to the parking lot.'
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

    render(<DeleteTimeSlotButton timeSlot={timeSlot} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', {
      name: 'Delete time slot',
    });

    await userEvent.click(deleteButton, { skipHover: true });

    const modal = screen.getByRole('dialog', { name: 'Delete the time slot?' });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(modal).not.toBeInTheDocument();
    await waitFor(() => expect(deleteButton).toHaveFocus());

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('should disable delete if no callback is passed', () => {
    render(<DeleteTimeSlotButton timeSlot={timeSlot} />);

    expect(
      screen.getByRole('button', { name: 'Delete time slot' })
    ).toBeDisabled();
  });
});
