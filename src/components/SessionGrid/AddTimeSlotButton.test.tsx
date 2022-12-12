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

import { ThemeSelectionProvider } from '@matrix-widget-toolkit/react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { AddTimeSlotButton } from './AddTimeSlotButton';

describe('<AddTimeSlotButton>', () => {
  const wrapper = ({ children }: PropsWithChildren<{}>) => (
    <ThemeSelectionProvider>
      <StyledComponentsThemeProvider>{children}</StyledComponentsThemeProvider>
    </ThemeSelectionProvider>
  );

  it('should add a sessions time slot', async () => {
    const onAddTimeSlot = jest.fn();
    render(<AddTimeSlotButton onAddTimeSlot={onAddTimeSlot} />, {
      wrapper,
    });

    await userEvent.click(
      screen.getByRole('listbox', {
        name: 'Create a time slot',
        expanded: false,
      })
    );

    const list = screen.getByRole('listbox', {
      name: 'Create a time slot',
      expanded: true,
    });

    await userEvent.click(
      within(list).getByRole('option', { name: 'Create a time slot' })
    );
    expect(
      screen.getByRole('listbox', {
        name: 'Create a time slot',
        expanded: false,
      })
    ).toBeInTheDocument();
    expect(onAddTimeSlot).toBeCalledWith('sessions');
  });

  it('should add a common event time slot', async () => {
    const onAddTimeSlot = jest.fn();
    render(<AddTimeSlotButton onAddTimeSlot={onAddTimeSlot} />, {
      wrapper,
    });

    await userEvent.click(
      screen.getByRole('listbox', {
        name: 'Create a time slot',
        expanded: false,
      })
    );

    const list = screen.getByRole('listbox', {
      name: 'Create a time slot',
      expanded: true,
    });

    await userEvent.click(
      within(list).getByRole('option', { name: 'Create a common event' })
    );

    expect(
      screen.getByRole('listbox', {
        name: 'Create a time slot',
        expanded: false,
      })
    ).toBeInTheDocument();
    expect(onAddTimeSlot).toBeCalledWith('common-event');
  });

  it('should not add a new time slot if the user cancels the selection', async () => {
    const onAddTimeSlot = jest.fn();
    render(<AddTimeSlotButton onAddTimeSlot={onAddTimeSlot} />, {
      wrapper,
    });
    const listbox = screen.getByRole('listbox', {
      name: 'Create a time slot',
      expanded: false,
    });
    await userEvent.click(listbox);
    listbox.blur();

    expect(
      screen.getByRole('listbox', {
        name: 'Create a time slot',
        expanded: false,
      })
    ).toBeInTheDocument();
    expect(onAddTimeSlot).not.toBeCalled();
  });
});
