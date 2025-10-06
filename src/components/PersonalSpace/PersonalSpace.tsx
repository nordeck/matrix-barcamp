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

import { useEffect, useRef, useState } from 'react';
import { AutoFocusInside, FocusOn, InFocusGuard } from 'react-focus-on';
import { useTranslation } from 'react-i18next';
import { usePrevious } from 'react-use';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Stack
} from '@mui/material';
import { Person, Help, Lightbulb } from '@mui/icons-material';
import { usePowerLevels } from '../../store';
import { useNotifications } from '../NotificationsProvider';
import { styled } from '../StyledComponentsThemeProvider';
import { Tooltip } from '../Tooltip';
import { useId } from '../utils';
import { PersonalTopicsContextProvider } from './PersonalTopicsContextProvider';
import { TopicList } from './TopicList';
import { TopicSubmissionToggle } from './TopicSubmissionToggle';

const SideBySide = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
});

export function PersonalSpace() {
  const { showInfo } = useNotifications();
  const { t } = useTranslation();
  const { canModerate, canParticipantsSubmitTopics } = usePowerLevels();
  const headerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const headerId = useId();
  const previousCanParticipantsSubmitTopics = usePrevious(
    canParticipantsSubmitTopics
  );

  useEffect(() => {
    if (
      previousCanParticipantsSubmitTopics === false &&
      canParticipantsSubmitTopics === true
    ) {
      showInfo(
        t(
          'personalSpace.submission.notificationOpened',
          'Topic submission was opened.'
        )
      );
    } else if (
      previousCanParticipantsSubmitTopics === true &&
      canParticipantsSubmitTopics === false
    ) {
      showInfo(
        t(
          'personalSpace.submission.notificationClosed',
          'Topic submission was closed.'
        )
      );
    }
  }, [
    canParticipantsSubmitTopics,
    previousCanParticipantsSubmitTopics,
    showInfo,
    t,
  ]);

  return (
    <>
      <Stack direction="row" spacing={0} sx={{ width: '100%' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Lightbulb />}
          onClick={() => setOpen(true)}
          fullWidth
          sx={{
            borderRadius: canModerate ? '4px 0 0 4px' : '4px',
            height: 40
          }}
        >
          {t('personalSpace.submitProposal', 'Submit a topic')}
        </Button>
        {canModerate && <TopicSubmissionToggle />}
      </Stack>

      <Dialog
        onClose={() => setOpen(false)}
        open={open}
        maxWidth="md"
        fullWidth
        aria-labelledby={headerId}
      >
        <DialogTitle id={headerId}>
          <SideBySide ref={headerRef}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Person />
              <Typography variant="h6">
                {t('personalSpace.title', 'Personal Space')}
              </Typography>
            </Stack>
            <Tooltip
              content={t(
                'personalSpace.explanation',
                'The Personal Space is a place to prepare a topic before they are submitted to the topic queue. Proposals remain private until they are submitted.'
              )}
            >
              <IconButton size="small">
                <Help />
              </IconButton>
            </Tooltip>
          </SideBySide>
        </DialogTitle>
        <DialogContent>
          <FocusOn shards={[headerRef, actionsRef]} scrollLock={false}>
            <PersonalTopicsContextProvider>
              <TopicList />
            </PersonalTopicsContextProvider>
          </FocusOn>
        </DialogContent>
        <DialogActions>
          <div ref={actionsRef}>
            <AutoFocusInside className="actions">
              <InFocusGuard>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setOpen(false)}
                >
                  {t('personalSpace.close', 'Close')}
                </Button>
              </InFocusGuard>
            </AutoFocusInside>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}
