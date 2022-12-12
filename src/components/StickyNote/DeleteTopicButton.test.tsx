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
import { DeleteTopicButton } from './DeleteTopicButton';

describe('<DeleteTopicButton>', () => {
  it('should delete the topic if the user confirms', async () => {
    const onDelete = jest.fn();

    render(<DeleteTopicButton topicTitle="My Topic" onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete topic' }));

    const modal = screen.getByRole('dialog', { name: 'Delete the topic?' });
    expect(modal).toHaveAccessibleDescription(
      'Do you want to delete the topic “My Topic”?'
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

    render(<DeleteTopicButton topicTitle="My Topic" onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete topic' });

    await userEvent.click(deleteButton);

    const modal = screen.getByRole('dialog', { name: 'Delete the topic?' });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(modal).not.toBeInTheDocument();
    await waitFor(() => expect(deleteButton).toHaveFocus());

    expect(onDelete).not.toHaveBeenCalled();
  });
});
