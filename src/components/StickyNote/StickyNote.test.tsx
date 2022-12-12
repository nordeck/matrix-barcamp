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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { StickyNote } from './StickyNote';

describe('<StickyNote>', () => {
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
    render(<StickyNote {...topic} />, { wrapper });

    expect(screen.getByText(/Team Review/)).toBeInTheDocument();
    expect(screen.getByText(/Vormelker/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We share updates on overall progress/)
    ).toBeInTheDocument();
  });

  it('should render its props in collapsed mode', () => {
    render(<StickyNote {...topic} collapsed />, {
      wrapper,
    });

    expect(screen.getByText(/Team Review/)).toBeInTheDocument();
    expect(screen.getByText(/Vormelker/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We share updates on overall progress/)
    ).toBeInTheDocument();
  });

  it('should edit the topic', async () => {
    const onUpdate = jest.fn();
    const onChange = jest.fn();

    render(<StickyNote {...topic} onUpdate={onUpdate} onChange={onChange} />, {
      wrapper,
    });

    await userEvent.type(screen.getByLabelText(/title/i), '1');
    expect(onUpdate).not.toBeCalled();
    expect(onChange).toBeCalledWith({ title: 'Team Review1' });

    await userEvent.tab();
    expect(onUpdate).toBeCalledWith({ title: 'Team Review1' });

    onUpdate.mockReset();
    onChange.mockReset();

    await userEvent.type(screen.getByLabelText(/description/i), '1');
    expect(onUpdate).not.toBeCalled();
    expect(onChange).toBeCalledWith({
      description: expect.stringMatching(/1$/),
    });

    await userEvent.tab();
    expect(onUpdate).toBeCalledWith({
      description: expect.stringMatching(/1$/),
    });
  });

  it('should display the children in view mode', () => {
    render(
      <StickyNote {...topic}>
        <p>My Content</p>
      </StickyNote>,
      { wrapper }
    );

    expect(screen.getByText(/my content/i)).toBeInTheDocument();
  });

  it('should display the children in edit mode', () => {
    render(
      <StickyNote {...topic} onUpdate={jest.fn()}>
        <p>My Content</p>
      </StickyNote>,
      { wrapper }
    );

    expect(screen.getByText(/my content/i)).toBeInTheDocument();
  });

  it('should display the headerSlot in view mode', () => {
    render(<StickyNote {...topic} headerSlot={<p>My Content</p>} />, {
      wrapper,
    });

    expect(screen.getByText(/my content/i)).toBeInTheDocument();
  });

  it('should display the headerSlot in edit mode', () => {
    render(
      <StickyNote
        {...topic}
        onUpdate={jest.fn()}
        headerSlot={<p>My Content</p>}
      />,
      { wrapper }
    );

    expect(screen.getByText(/my content/i)).toBeInTheDocument();
  });
});
