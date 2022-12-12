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

import { ReactNode, useState } from 'react';
import { FocusOn } from 'react-focus-on';
import { useTranslation } from 'react-i18next';
import { Icon, Modal } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';
import { Tooltip } from '../Tooltip';
import { StickyNote, StickyNoteButton, StickyNoteProps } from './StickyNote';

const ExpandIcon = styled(Icon)({
  '&&&&:before': {
    content: '"\\f424"',
  },
});

const HeaderSlotContainer = styled.div({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
});

type ExpandableStickyNoteProps = StickyNoteProps & {
  /**
   * Content that is displayed in the top right corner of
   * the sticky node.
   */
  expandedHeaderSlot?: ReactNode;
};

export function ExpandableStickyNote({
  expandedHeaderSlot,
  children,
  ...props
}: ExpandableStickyNoteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const modalText = t('topic.showDetailsButton', 'Show details');
  const closeDetailsButtonText = t('topic.closeDetailsButton', 'Close details');

  return (
    <StickyNote
      {...props}
      headerSlot={
        <HeaderSlotContainer>
          {props.headerSlot}
          <Modal
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            open={open}
            size="tiny"
            aria-modal="true"
            role="dialog"
            trigger={
              <div>
                {/* div is required to keep the click target working */}
                <Tooltip content={modalText}>
                  <StickyNoteButton
                    icon={<ExpandIcon />}
                    aria-label={modalText}
                  />
                </Tooltip>
              </div>
            }
          >
            <FocusOn scrollLock={false}>
              <StickyNote
                {...props}
                collapsed={false}
                large
                headerSlot={
                  <>
                    <Tooltip
                      content={closeDetailsButtonText}
                      position="bottom right"
                    >
                      <StickyNoteButton
                        icon="close"
                        aria-label={closeDetailsButtonText}
                        onClick={() => setOpen(false)}
                        size={'large'}
                      />
                    </Tooltip>
                    {expandedHeaderSlot}
                  </>
                }
              />
            </FocusOn>
          </Modal>
        </HeaderSlotContainer>
      }
    >
      {children}
    </StickyNote>
  );
}
