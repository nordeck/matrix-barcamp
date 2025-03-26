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
import userEvent from '@testing-library/user-event';
import { IconPicker } from './IconPicker';

describe('<IconPicker>', () => {
  it('should render read only icon', () => {
    render(<IconPicker size="big" icon="dog" readOnly onChange={() => {}} />);

    expect(screen.getByRole('img', { name: 'Icon "dog"' })).toBeInTheDocument();
  });

  it('should render picker button', () => {
    render(<IconPicker size="big" icon="dog" onChange={() => {}} />);

    expect(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    ).toBeInTheDocument();
  });

  it('should show selected icon in popup', async () => {
    render(<IconPicker size="big" icon="dog" onChange={() => {}} />);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    expect(within(list).getAllByRole('option')).toHaveLength(30);
    expect(
      within(list).getByRole('option', { name: 'Icon "dog"', selected: true })
    ).toBeInTheDocument();

    // Close popup to avoid warnings
    await userEvent.keyboard('{Escape}');
  });

  it('should select icon by clicking', async () => {
    const onChange = jest.fn();

    render(<IconPicker size="big" icon="dog" onChange={onChange} />);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    await userEvent.click(
      within(list).getByRole('option', { name: 'Icon "star"' })
    );

    expect(list).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { expanded: false })
    ).toBeInTheDocument();
    expect(onChange).toBeCalledWith('star');
  });

  it('should select icon using keyboard interactions', async () => {
    const onChange = jest.fn();
    render(<IconPicker size="big" icon="dog" onChange={onChange} />);

    screen
      .getByRole('combobox', { name: 'Icon "dog"', expanded: false })
      .focus();

    await userEvent.keyboard('{Enter}');
    const list = screen.getByRole('listbox', { name: /available icons/i });

    // Select another
    await userEvent.keyboard('{ArrowUp}');

    expect(
      within(list).getByRole('option', { name: 'Icon "frog"', selected: true })
    ).toBeInTheDocument();

    // Go to start
    await userEvent.keyboard('{Home}');

    expect(
      within(list).getByRole('option', {
        name: 'Icon "coffee"',
        selected: true,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Icon "coffee"', expanded: true })
    ).toBeInTheDocument();

    // Wrap over first
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');

    expect(
      within(list).getByRole('option', {
        name: 'Icon "server"',
        selected: true,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Icon "server"', expanded: true })
    ).toBeInTheDocument();

    // Go to end
    await userEvent.keyboard('{End}');

    expect(
      within(list).getByRole('option', {
        name: 'Icon "face surprise"',
        selected: true,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: 'Icon "face surprise"',
        expanded: true,
      })
    ).toBeInTheDocument();

    // Wrap over last
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');

    expect(
      within(list).getByRole('option', { name: 'Icon "lemon"', selected: true })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Icon "lemon"', expanded: true })
    ).toBeInTheDocument();

    // Finally select
    await userEvent.keyboard('{Enter}');

    expect(list).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { expanded: false })
    ).toBeInTheDocument();

    expect(onChange).toBeCalledWith('lemon');
  });

  it('should set focus inside picker on open and restore after closing', async () => {
    render(<IconPicker size="big" icon="dog" onChange={() => {}} />);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    expect(
      within(list).getByRole('option', { name: 'Icon "dog"', selected: true })
    ).toHaveFocus();

    await userEvent.click(
      within(list).getByRole('option', {
        name: 'Icon "cheese"',
      })
    );

    expect(list).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { expanded: false })).toHaveFocus();
  });

  it('should trap focus inside picker', async () => {
    render(
      <>
        <IconPicker size="big" icon="dog" onChange={() => {}} />
        <button>Test</button>
      </>
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    expect(
      within(list).getByRole('option', { name: 'Icon "dog"', selected: true })
    ).toHaveFocus();

    // Go to the end of the icons and wrap around using tab key
    await userEvent.keyboard('{End}');
    await userEvent.tab();

    expect(
      within(list).getByRole('option', {
        name: 'Icon "coffee"',
        selected: true,
      })
    ).toHaveFocus();

    // Close popup to avoid warnings
    await userEvent.keyboard('{Escape}');
  });

  it('should cancel pick on click outside of the popup', async () => {
    const onChange = jest.fn();
    const { container } = render(
      <IconPicker size="big" icon="dog" onChange={() => {}} />
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.click(container);

    expect(list).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    ).toBeInTheDocument();
    expect(onChange).not.toBeCalled();
  });

  it('should cancel if escape key is pressed', async () => {
    const onChange = jest.fn();
    render(<IconPicker size="big" icon="dog" onChange={() => {}} />);

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    await userEvent.keyboard('{ArrowLeft}{Escape}');

    expect(list).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Icon "dog"', expanded: false })
    ).toBeInTheDocument();
    expect(onChange).not.toBeCalled();
  });
});
