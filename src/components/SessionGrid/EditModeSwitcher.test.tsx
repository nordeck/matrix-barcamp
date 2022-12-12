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
import { ComponentType, PropsWithChildren } from 'react';
import { EditModeProvider, useEditMode } from './EditModeContext';
import { EditModeSwitcher } from './EditModeSwitcher';

describe('<EditModeSwitcher/>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    const Component = () => {
      const { canEditGrid } = useEditMode();
      return <>{canEditGrid ? 'EDITABLE' : 'VIEWABLE'}</>;
    };
    wrapper = ({ children }) => {
      return (
        <EditModeProvider>
          <Component />
          {children}
        </EditModeProvider>
      );
    };
  });

  it('should render without exploding', () => {
    render(<EditModeSwitcher />, { wrapper });

    expect(
      screen.getByRole('button', { name: /edit tracks and time slots/i })
    ).toBeInTheDocument();
  });

  it('should toggle the context', async () => {
    render(<EditModeSwitcher />, { wrapper });

    expect(screen.getByText(/viewable/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /edit tracks and time slots/i })
    );

    expect(screen.getByText(/editable/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /edit tracks and time slots/i })
    );

    expect(screen.getByText(/viewable/i)).toBeInTheDocument();
  });
});
