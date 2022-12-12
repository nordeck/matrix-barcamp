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
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { ExpandableStickyNote } from './ExpandableStickyNote';

describe('<ExpandableStickyNote>', () => {
  const topic = {
    title: 'Team Review',
    description:
      'We share updates on overall progress, key metrics, and anecdotes to give our team an up-to-date understanding of current initiatives.',
    author: '@vormelker-juergen',
  };
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    wrapper = ({ children }) => {
      return (
        <ThemeSelectionProvider>
          <StyledComponentsThemeProvider>
            {children}
          </StyledComponentsThemeProvider>
        </ThemeSelectionProvider>
      );
    };
  });

  it('should render its props', () => {
    render(<ExpandableStickyNote {...topic} />, { wrapper });

    expect(screen.getByText(/Team Review/)).toBeInTheDocument();
    expect(screen.getByText(/Vormelker/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We share updates on overall progress/)
    ).toBeInTheDocument();
  });

  it('should expand the topic', async () => {
    render(<ExpandableStickyNote {...topic} />, {
      wrapper,
    });

    expect(screen.getByText(/Team Review/)).toBeInTheDocument();
    expect(screen.getByText(/Vormelker/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We share updates on overall progress/)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /show details/i })
    );

    const modal = screen.getByRole('dialog');

    expect(within(modal).getByText(/Team Review/)).toBeInTheDocument();
    expect(within(modal).getByText(/Vormelker/i)).toBeInTheDocument();
    expect(
      within(modal).getByText(/We share updates on overall progress/)
    ).toBeInTheDocument();

    await userEvent.click(
      within(modal).getByRole('button', { name: /close details/i })
    );

    expect(modal).not.toBeInTheDocument();
  });

  it('should trap focus when expanded', async () => {
    render(<ExpandableStickyNote {...topic} />, {
      wrapper,
    });

    const expandButton = screen.getByRole('button', { name: /show details/i });
    await userEvent.click(expandButton);

    const modal = screen.getByRole('dialog');

    const closeButton = within(modal).getByRole('button', {
      name: /close details/i,
    });
    expect(closeButton).toHaveFocus();

    await userEvent.tab();
    await userEvent.tab();

    expect(closeButton).toHaveFocus();

    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(expandButton).toHaveFocus();
    });
  });

  it('should display the expandedHeaderSlot when expanded', async () => {
    render(
      <ExpandableStickyNote
        {...topic}
        expandedHeaderSlot={<p>My Content</p>}
      />,
      {
        wrapper,
      }
    );

    const expandButton = screen.getByRole('button', { name: /show details/i });
    await userEvent.click(expandButton);

    const modal = screen.getByRole('dialog');

    expect(within(modal).getByText(/my content/i)).toBeInTheDocument();
  });
});
