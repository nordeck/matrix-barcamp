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

import { render, screen, waitFor, within } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { ComponentType, PropsWithChildren } from 'react';
import {
  NotificationsDisplay,
  NotificationsProvider,
  useNotifications,
} from './NotificationsProvider';

describe('NotificationsProvider', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <NotificationsProvider>{children}</NotificationsProvider>
    );
  });

  it('should provide context', () => {
    const { result } = renderHook(useNotifications, { wrapper });

    expect(result.current.notifications).toEqual([]);

    act(() => {
      result.current.showNotification('error', 'My Error');
    });

    expect(result.current.notifications).toEqual([
      { id: expect.any(String), type: 'error', message: 'My Error' },
    ]);
  });

  it('should add multiple notifications', () => {
    const { result } = renderHook(useNotifications, { wrapper });

    expect(result.current.notifications).toEqual([]);

    act(() => {
      result.current.showError('My Error');
      result.current.showInfo('My Info');
    });

    expect(result.current.notifications).toEqual([
      { id: expect.any(String), type: 'error', message: 'My Error' },
      { id: expect.any(String), type: 'info', message: 'My Info' },
    ]);
  });

  it('should not store multiple notifications with the same context', () => {
    const { result } = renderHook(useNotifications, { wrapper });

    expect(result.current.notifications).toEqual([]);

    act(() => {
      result.current.showError('My Error', { context: 'A' });
      result.current.showInfo('My Info', { context: 'A' });
      result.current.showError('My Error', { context: 'B' });
      result.current.showError('My Error', { context: 'A' });
      result.current.showError('My Error', { context: 'A' });
      result.current.showError('My Error', { context: 'A' });
    });

    expect(result.current.notifications).toEqual([
      {
        id: expect.any(String),
        type: 'error',
        message: 'My Error',
        opts: { context: 'A' },
      },
      {
        id: expect.any(String),
        type: 'info',
        message: 'My Info',
        opts: { context: 'A' },
      },
      {
        id: expect.any(String),
        type: 'error',
        message: 'My Error',
        opts: { context: 'B' },
      },
    ]);
  });
});

describe('NotificationsDisplay', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render notifications', () => {
    render(
      <NotificationsDisplay
        notifications={[
          { id: 'error-0', type: 'error', message: 'First Error' },
          { id: 'error-1', type: 'info', message: 'Second Info' },
        ]}
        onDelete={() => {}}
      />
    );

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('First Error')).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');

    const other = screen.getByText('Second Info');
    expect(other).not.toHaveAttribute('aria-live', 'assertive');
  });

  it('should delete notification after a timeout', async () => {
    jest.useFakeTimers();
    const onDelete = jest.fn();

    render(
      <NotificationsDisplay
        notifications={[
          { id: 'error-0', type: 'error', message: 'First Error' },
        ]}
        onDelete={onDelete}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => {
      expect(onDelete).toBeCalledWith('error-0');
    });
  });
});
