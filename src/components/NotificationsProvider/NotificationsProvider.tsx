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

import { nanoid } from 'nanoid';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Fade, IconButton } from '@mui/material';
import { Warning, Info, Close } from '@mui/icons-material';
import { styled } from '../StyledComponentsThemeProvider';

type NotificationType = 'error' | 'info';

type NotificationsEntry = {
  id: string;
  message: string;
  type: NotificationType;
  opts?: { context?: string };
};

type NotificationsState = {
  /**
   * Show an error message.
   *
   * @param message - the message to show
   * @param opts - optional options
   *               context: when defined, only one notification of the
   *                        same context is shown at a time.
   */
  showError(message: string, opts?: { context?: string }): void;

  /**
   * Show an informative message.
   *
   * @param message - the message to show
   * @param opts - optional options
   *               context: when defined, only one notification of the
   *                        same context is shown at a time.
   */
  showInfo(message: string, opts?: { context?: string }): void;

  /**
   * Show a message.
   *
   * @param type - the type of notification to show
   * @param message - the message to show
   * @param opts - optional options
   *               context: when defined, only one notification of the
   *                        same context is shown at a time.
   */
  showNotification(
    type: NotificationType,
    message: string,
    opts?: { context?: string }
  ): void;

  /**
   * A list of all notification entries
   */
  notifications: NotificationsEntry[];
};

const NotificationsContext = createContext<NotificationsState | undefined>(
  undefined
);

export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);

  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationsContext'
    );
  }

  return context;
}

const NotificationsContainer = styled.div({
  position: 'absolute',
  bottom: 8,
  left: 8,
  zIndex: 2000,
  width: 400,
  maxWidth: 'calc(100% - 16px)',
}) as React.ComponentType<React.HTMLProps<HTMLDivElement>>;

function NotificationDisplay({
  type,
  message,
  onDelete,
  latest = false,
}: {
  type: NotificationType;
  message: string;
  onDelete: () => void;
  latest?: boolean;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Fade in={visible} onExited={onDelete} timeout={300}>
      <Alert
        severity={type}
        icon={type === 'error' ? <Warning /> : <Info />}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setVisible(false)}
          >
            <Close fontSize="small" />
          </IconButton>
        }
        sx={{
          mb: 1,
          boxShadow: (theme) => theme.shadows[4],
        }}
        role={latest ? 'alert' : undefined}
        aria-live={latest ? 'assertive' : undefined}
      >
        {message}
      </Alert>
    </Fade>
  );
}

export function NotificationsDisplay({
  notifications,
  onDelete,
}: {
  notifications: NotificationsEntry[];
  onDelete: (id: string) => void;
}) {
  return (
    <NotificationsContainer key="notifications-container">
      {notifications
        .map((notification, idx) => (
          <NotificationDisplay
            key={notification.id}
            type={notification.type}
            latest={idx === 0}
            message={notification.message}
            onDelete={() => onDelete(notification.id)}
          />
        ))
        .reverse()}
    </NotificationsContainer>
  );
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationsEntry[]>([]);

  const showNotification = useCallback(
    (type: NotificationType, message: string, opts?: { context?: string }) => {
      setNotifications((notifications) => {
        if (
          !opts?.context ||
          !notifications.some(
            (n) => n.type === type && n?.opts?.context === opts?.context
          )
        ) {
          return notifications.concat({ id: nanoid(), type, message, opts });
        }

        return notifications;
      });
    },
    []
  );

  const showError = useCallback(
    (message: string, opts?: { context?: string }) => {
      showNotification('error', message, opts);
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, opts?: { context?: string }) => {
      showNotification('info', message, opts);
    },
    [showNotification]
  );

  const context = useMemo<NotificationsState>(
    () => ({
      showError,
      showInfo,
      showNotification,
      notifications,
    }),
    [notifications, showError, showInfo, showNotification]
  );

  return (
    <NotificationsContext.Provider value={context}>
      {children}
      <NotificationsDisplay
        notifications={notifications}
        onDelete={(id) =>
          setNotifications((notifications) =>
            notifications.filter((e) => e.id !== id)
          )
        }
      />
    </NotificationsContext.Provider>
  );
}
