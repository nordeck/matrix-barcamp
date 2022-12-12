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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineDurationEdit } from './InlineDurationEdit';

describe('<InlineDurationEdit/>', () => {
  it('should render readOnly text', () => {
    render(<InlineDurationEdit minutes={5} onChange={() => {}} readOnly />);

    expect(screen.getByText('5 min.')).toBeInTheDocument();
  });

  it('should render editable input', async () => {
    const onChange = jest.fn();
    render(<InlineDurationEdit minutes={5} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    expect(input).toHaveValue(5);

    await userEvent.clear(input);
    await userEvent.type(input, '120');

    expect(input).toHaveValue(120);

    await userEvent.tab();

    expect(onChange).toBeCalledWith(120);
  });

  it('should submit value on enter', async () => {
    const onChange = jest.fn();
    render(<InlineDurationEdit minutes={5} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    expect(input).toHaveValue(5);

    await userEvent.clear(input);
    await userEvent.type(input, '120{Enter}');

    expect(input).toHaveValue(120);

    expect(onChange).toBeCalledWith(120);
  });

  it('should return to initial value if the user leaves the field empty', async () => {
    const onChange = jest.fn();
    render(<InlineDurationEdit minutes={10} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    await userEvent.clear(input);
    expect(input).toHaveValue(null);

    await userEvent.tab();

    expect(input).toHaveValue(10);

    expect(onChange).not.toBeCalled();
  });

  it('should return to initial value if the user hits enter on an empty field', async () => {
    const onChange = jest.fn();
    render(<InlineDurationEdit minutes={10} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    await userEvent.clear(input);
    await userEvent.type(input, '{Enter}');

    expect(input).toHaveValue(10);

    expect(onChange).not.toBeCalled();
  });

  it('should clamp value if negative number is entered', async () => {
    const onChange = jest.fn();
    render(<InlineDurationEdit minutes={10} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    await userEvent.clear(input);
    await userEvent.type(input, '-5{Enter}');

    expect(onChange).toBeCalledWith(5);
  });

  it('should clamp value if number is too large', async () => {
    const onChange = jest.fn();
    render(<InlineDurationEdit minutes={10} onChange={onChange} />);

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    await userEvent.clear(input);
    await userEvent.type(input, '9999999{Enter}');

    expect(onChange).toBeCalledWith(1440);
  });

  it('should react to outside changes of value', async () => {
    const { rerender } = render(
      <InlineDurationEdit minutes={10} onChange={() => {}} />
    );

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    rerender(<InlineDurationEdit minutes={20} onChange={() => {}} />);

    expect(input).toHaveValue(20);
  });

  it('should restore value if read only mode is activated', async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <InlineDurationEdit minutes={10} onChange={onChange} />
    );

    const input = screen.getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    await userEvent.clear(input);
    await userEvent.type(input, '20');

    expect(input).toHaveValue(20);

    rerender(<InlineDurationEdit minutes={10} onChange={onChange} readOnly />);

    expect(screen.getByText('10 min.')).toBeInTheDocument();

    rerender(<InlineDurationEdit minutes={10} onChange={onChange} />);

    expect(
      screen.getByRole('spinbutton', {
        name: /track duration in minutes/i,
      })
    ).toHaveValue(10);

    expect(onChange).not.toBeCalled();
  });
});
