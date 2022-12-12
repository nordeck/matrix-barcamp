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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from 'semantic-ui-react';
import { Tooltip } from './Tooltip';

describe('<Tooltip>', () => {
  it('should open and close on hover after a short delay', async () => {
    render(
      <Tooltip content="Delete the active element">
        <Button>Delete</Button>
      </Tooltip>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();

    await userEvent.hover(screen.getByRole('button'));

    expect(screen.queryByText('Delete the active element')).toBeNull();

    const tooltip = await screen.findByText('Delete the active element');
    expect(tooltip).toBeInTheDocument();

    await userEvent.unhover(screen.getByRole('button'));

    await waitFor(() => expect(tooltip).not.toBeInTheDocument());
  });
});
