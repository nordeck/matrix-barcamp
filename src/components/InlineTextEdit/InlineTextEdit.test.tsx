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
import { InlineTextEdit } from './InlineTextEdit';

describe('<InlineTextedit>', () => {
  it('should render readonly text', () => {
    render(
      <InlineTextEdit
        value="Hello World"
        label="Message"
        readOnly
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render editable input', async () => {
    const onChange = jest.fn();

    render(
      <InlineTextEdit value="Hello World" label="Message" onChange={onChange} />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    expect(input).toHaveValue('Hello World');

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'Welcome');

    expect(input).toHaveValue('Welcome');

    await userEvent.tab();

    expect(onChange).toBeCalledWith('Welcome');
  });

  it('should submit value on enter', async () => {
    const onChange = jest.fn();

    render(
      <InlineTextEdit value="Hello World" label="Message" onChange={onChange} />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    expect(input).toHaveValue('Hello World');

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'Welcome{Enter}');

    expect(input).toHaveValue('Welcome');

    expect(onChange).toBeCalledWith('Welcome');
  });

  it('should return to initial value if the user leaves the field empty', async () => {
    const onChange = jest.fn();

    render(
      <InlineTextEdit value="Hello World" label="Message" onChange={onChange} />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.click(input);
    await userEvent.clear(input);

    expect(input).toHaveValue('');

    await userEvent.tab();

    expect(input).toHaveValue('Hello World');

    expect(onChange).not.toBeCalled();
  });

  it('should react to outside changes of value', () => {
    const { rerender } = render(
      <InlineTextEdit value="Hello World" label="Message" onChange={() => {}} />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    rerender(
      <InlineTextEdit value="New Value" label="Message" onChange={() => {}} />
    );

    expect(input).toHaveValue('New Value');
  });

  it('should restore value if read only mode is activated', async () => {
    const { rerender } = render(
      <InlineTextEdit value="Hello World" label="Message" onChange={() => {}} />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'New Value');

    expect(input).toHaveValue('New Value');

    rerender(
      <InlineTextEdit
        value="Hello World"
        readOnly
        label="Message"
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();

    rerender(
      <InlineTextEdit value="Hello World" label="Message" onChange={() => {}} />
    );

    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Hello World'
    );
  });
});
