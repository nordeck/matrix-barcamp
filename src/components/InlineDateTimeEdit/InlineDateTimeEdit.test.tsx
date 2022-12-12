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

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineDateTimeEdit } from './InlineDateTimeEdit';

describe('<InlineDateTimeEdit/>', () => {
  it('should render readOnly text', () => {
    render(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2022-04-22T14:00:00+00:00"
        onChange={() => {}}
        readOnly
      />
    );

    expect(screen.getByText('2:00 PM')).toBeInTheDocument();
  });

  it('should render editable input', async () => {
    const onChange = jest.fn();
    render(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2022-04-22T14:00:00+00:00"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Start day and time');

    expect(input).toHaveValue('2022-04-22T14:00');

    // user-event doesn't support typing to datetime-local inputs, therefore we
    // focus and change the value manually
    // https://github.com/testing-library/user-event/issues/688
    await userEvent.click(input);
    fireEvent.change(input, { target: { value: '2030-04-22T14:00' } });
    expect(input).toHaveValue('2030-04-22T14:00');
    await userEvent.tab();

    expect(onChange).toBeCalledWith('2030-04-22T14:00:00Z');
  });

  it('should submit value on enter', async () => {
    const onChange = jest.fn();
    render(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2022-04-22T14:00:00+00:00"
        onChange={onChange}
      />
    );

    const input = screen.getByLabelText('Start day and time');

    expect(input).toHaveValue('2022-04-22T14:00');

    fireEvent.change(input, { target: { value: '2030-04-22T14:00' } });
    await userEvent.type(input, '{Enter}');

    expect(input).toHaveValue('2030-04-22T14:00');

    expect(onChange).toBeCalledWith('2030-04-22T14:00:00Z');
  });

  it('should react to outside changes of value', async () => {
    const { rerender } = render(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2022-04-22T14:00:00+00:00"
        onChange={() => {}}
      />
    );

    const input = screen.getByLabelText('Start day and time');

    rerender(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2030-04-22T14:00:00+00:00"
        onChange={() => {}}
      />
    );

    expect(input).toHaveValue('2030-04-22T14:00');
  });

  it('should update readonly value if read only mode is activated', async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2022-04-22T14:00:00+00:00"
        onChange={() => {}}
      />
    );

    const input = screen.getByLabelText('Start day and time');

    expect(input).toHaveValue('2022-04-22T14:00');

    rerender(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2022-04-22T14:00:00+00:00"
        onChange={() => {}}
        readOnly
      />
    );

    expect(screen.getByText('2:00 PM')).toBeInTheDocument();

    rerender(
      <InlineDateTimeEdit
        label="Start day and time"
        value="2030-04-22T14:00:00+00:00"
        onChange={onChange}
      />
    );

    const inputUpdated = screen.getByLabelText('Start day and time');

    expect(inputUpdated).toHaveValue('2030-04-22T14:00');

    expect(onChange).not.toBeCalled();
  });
});
