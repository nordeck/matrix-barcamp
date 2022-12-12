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
import { TextArea } from './TextArea';

describe('<TextArea>', () => {
  it('should render editable text area', async () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();

    render(
      <TextArea
        value="Hello World"
        label="Message"
        placeholder="Message"
        onChange={onChange}
        onBlur={onBlur}
        lengthZeroText="Please enter a text"
      />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    expect(input).toHaveValue('Hello World');

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'Welcome');

    expect(input).toHaveValue('Welcome');

    expect(onChange).toHaveBeenLastCalledWith('Welcome');
    expect(onBlur).not.toBeCalled();

    await userEvent.tab();

    expect(onChange).toBeCalledWith('Welcome');
    expect(onBlur).toBeCalledWith('Welcome');
  });

  it('should return to initial value if the user leaves the field empty', async () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();

    render(
      <TextArea
        value="Hello World"
        label="Message"
        placeholder="Message"
        onChange={onChange}
        onBlur={onBlur}
        lengthZeroText="Please enter a text"
      />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.click(input);
    await userEvent.clear(input);

    expect(input).toHaveValue('');

    expect(onChange).lastCalledWith('');
    expect(onBlur).not.toBeCalled();
    expect(input).toBeInvalid();

    await userEvent.tab();

    expect(input).toHaveValue('Hello World');

    expect(onChange).toHaveBeenLastCalledWith('Hello World');
    expect(onBlur).not.toBeCalled();
    expect(input).not.toBeInvalid();
  });

  it('should react to outside changes of value', () => {
    const { rerender } = render(
      <TextArea
        value="Hello World"
        label="Message"
        placeholder="Message"
        lengthZeroText="Please enter a text"
      />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    rerender(
      <TextArea
        value="New Value"
        label="Message"
        placeholder="Message"
        lengthZeroText="Please enter a text"
      />
    );

    expect(input).toHaveValue('New Value');
  });

  it('should not accept more than 10 characters', async () => {
    const onChange = jest.fn();
    const onBlur = jest.fn();

    render(
      <TextArea
        value=""
        label="Message"
        placeholder="Message"
        onChange={onChange}
        onBlur={onBlur}
        maxLength={10}
        lengthZeroText="Please enter a text"
        lengthExceededText="Please use max 10 characters"
      />
    );

    const input = screen.getByRole('textbox', { name: 'Message' });

    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');

    expect(onChange).toHaveBeenLastCalledWith('Hello World');
    expect(onBlur).not.toBeCalled();

    await userEvent.tab();

    expect(onChange).toBeCalledWith('Hello World');
    expect(onBlur).not.toBeCalled();

    expect(input).toBeInvalid();
  });
});
