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
import { ConfirmDialog } from './ConfirmDialog';

describe('<ConfirmDialog>', () => {
  it('should open a confirm dialog if the trigger is clicked', async () => {
    const onConfirm = jest.fn();

    render(
      <ConfirmDialog
        title="My Title"
        message="My Message"
        confirmTitle="Delete"
        onConfirm={onConfirm}
      >
        <button>Trigger</button>
      </ConfirmDialog>
    );

    const triggerButton = screen.getByRole('button', { name: 'Trigger' });

    await userEvent.click(triggerButton);

    const modal = screen.getByRole('dialog', { name: 'My Title' });
    expect(modal).toHaveAccessibleDescription('My Message');
    expect(within(modal).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await userEvent.click(
      within(modal).getByRole('button', { name: 'Delete' })
    );

    expect(modal).not.toBeInTheDocument();

    await waitFor(() => expect(triggerButton).toHaveFocus());

    expect(onConfirm).toHaveBeenCalled();
  });

  it('should do nothing if the user cancels the deletion', async () => {
    const onConfirm = jest.fn();

    render(
      <ConfirmDialog
        title="My Title"
        message="My Message"
        confirmTitle="Delete"
        onConfirm={onConfirm}
      >
        <button>Trigger</button>
      </ConfirmDialog>
    );

    const triggerButton = screen.getByRole('button', { name: 'Trigger' });

    await userEvent.click(triggerButton);

    const modal = screen.getByRole('dialog', { name: 'My Title' });
    expect(modal).toHaveAccessibleDescription('My Message');
    expect(within(modal).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(modal).not.toBeInTheDocument();
    await waitFor(() => expect(triggerButton).toHaveFocus());

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
