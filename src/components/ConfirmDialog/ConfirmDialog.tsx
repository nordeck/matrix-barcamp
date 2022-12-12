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

import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from 'react';
import { AutoFocusInside, FocusOn, InFocusGuard } from 'react-focus-on';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from 'semantic-ui-react';
import { useId } from '../utils';

export type ConfirmDialogProps = PropsWithChildren<{
  title: string;
  message: ReactNode;
  confirmTitle: string;
  negative?: boolean;
  onConfirm: () => void;
}>;

export function ConfirmDialog({
  children,
  title,
  message,
  confirmTitle,
  negative = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setModalOpen(false);
    if (onConfirm) {
      onConfirm();
    }
  }, [onConfirm]);

  const headerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const headerId = useId();
  const contentId = useId();

  return (
    <Modal
      open={modalOpen}
      onOpen={handleOpen}
      onClose={handleClose}
      role="dialog"
      aria-labelledby={headerId}
      aria-describedby={contentId}
      aria-modal="true"
      trigger={children}
    >
      <Modal.Header id={headerId}>
        <div ref={headerRef}>{title}</div>
      </Modal.Header>
      <Modal.Content id={contentId}>
        <FocusOn shards={[headerRef, actionsRef]} scrollLock={false}>
          {message}
        </FocusOn>
      </Modal.Content>
      <Modal.Actions>
        <div ref={actionsRef}>
          <AutoFocusInside className="actions">
            <InFocusGuard>
              <Button positive basic onClick={handleClose}>
                {t('cancel', 'Cancel')}
              </Button>
              <Button
                negative={negative}
                positive={!negative}
                onClick={handleConfirm}
              >
                {confirmTitle}
              </Button>
            </InFocusGuard>
          </AutoFocusInside>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
