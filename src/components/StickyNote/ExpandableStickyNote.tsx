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
import { Dialog, DialogContent } from '@mui/material';
import { OpenInFull, Close } from '@mui/icons-material';
import { styled } from '../StyledComponentsThemeProvider';
import { Tooltip } from '../Tooltip';
import { StickyNote, StickyNoteButton, StickyNoteProps } from './StickyNote';

const ExpandIcon = styled(OpenInFull)({
  fontSize: '16px',
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

  // @ts-ignore - styled-components JSX component type issue
  const headerSlotContainer = (
    // @ts-ignore - styled-components JSX component type issue
    <HeaderSlotContainer>
      {props.headerSlot}
      <div>
        {/* div is required to keep the click target working */}
        <Tooltip content={modalText}>
          <StickyNoteButton
            onClick={() => setOpen(true)}
            aria-label={modalText}
          >
            {/* @ts-ignore - styled-components JSX component type issue */}
            <ExpandIcon />
          </StickyNoteButton>
        </Tooltip>
      </div>
    </HeaderSlotContainer>
  );

  return (
    <>
      <StickyNote
        {...props}
        headerSlot={headerSlotContainer}
      >
        {children}
      </StickyNote>
      <Dialog
        onClose={() => setOpen(false)}
        open={open}
        maxWidth="sm"
        fullWidth
        aria-modal="true"
      >
        <DialogContent sx={{ p: 0 }}>
          <FocusOn scrollLock={false}>
            <StickyNote
              {...props}
              collapsed={false}
              large
              headerSlot={
                <>
                  <Tooltip
                    content={closeDetailsButtonText}
                    placement="bottom-end"
                  >
                    <StickyNoteButton
                      aria-label={closeDetailsButtonText}
                      onClick={() => setOpen(false)}
                      size="large"
                    >
                      <Close />
                    </StickyNoteButton>
                  </Tooltip>
                  {expandedHeaderSlot}
                </>
              }
            />
          </FocusOn>
        </DialogContent>
      </Dialog>
    </>
  );
}
