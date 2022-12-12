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
import { act, renderHook } from '@testing-library/react-hooks';
import {
  EditModeGuard,
  EditModeProvider,
  useEditMode,
} from './EditModeContext';

describe('<EditModeProvider/>', () => {
  it('should provide context', () => {
    const { result } = renderHook(() => useEditMode(), {
      wrapper: ({ children }) => (
        <EditModeProvider>{children}</EditModeProvider>
      ),
    });

    expect(result.current).toEqual({
      canEditGrid: false,
      setCanEditGrid: expect.any(Function),
    });
  });

  it('should provide default value', () => {
    const { result } = renderHook(() => useEditMode(), {
      wrapper: ({ children }) => (
        <EditModeProvider enableEdit>{children}</EditModeProvider>
      ),
    });

    expect(result.current).toEqual({
      canEditGrid: true,
      setCanEditGrid: expect.any(Function),
    });
  });

  it('should override the internal state when the default value is changed', () => {
    const { rerender } = render(
      <EditModeProvider enableEdit>
        <EditModeGuard>Active</EditModeGuard>
      </EditModeProvider>
    );

    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(
      <EditModeProvider enableEdit={false}>
        <EditModeGuard>Active</EditModeGuard>
      </EditModeProvider>
    );

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('should update the value', () => {
    const { result } = renderHook(() => useEditMode(), {
      wrapper: ({ children }) => (
        <EditModeProvider>{children}</EditModeProvider>
      ),
    });

    expect(result.current).toEqual({
      canEditGrid: false,
      setCanEditGrid: expect.any(Function),
    });

    act(() => {
      result.current.setCanEditGrid((old) => !old);
    });

    expect(result.current).toEqual({
      canEditGrid: true,
      setCanEditGrid: expect.any(Function),
    });
  });

  it('hook should throw without context', () => {
    const { result } = renderHook(() => useEditMode());

    expect(result.error?.message).toMatch(
      /useeditmode must be used within a editmodeprovider/i
    );
  });
});

describe('<EditModeGuard/>', () => {
  it('should render children if edit mode is active', () => {
    render(
      <EditModeProvider enableEdit>
        <EditModeGuard>Children</EditModeGuard>
      </EditModeProvider>
    );

    expect(screen.getByText('Children')).toBeInTheDocument();
  });

  it('should skip children if edit mode is not active', () => {
    render(
      <EditModeProvider>
        <EditModeGuard>Children</EditModeGuard>
      </EditModeProvider>
    );

    expect(screen.queryByText('Children')).not.toBeInTheDocument();
  });
});
