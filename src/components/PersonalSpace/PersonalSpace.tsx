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
import { Button, ButtonGroup, Icon, Modal } from 'semantic-ui-react';
import { usePowerLevels } from '../../store';
import { ButtonWithIcon } from '../ButtonWithIcon';
import { useNotifications } from '../NotificationsProvider';
import { styled } from '../StyledComponentsThemeProvider';
import { Tooltip } from '../Tooltip';
import { useId } from '../utils';
import { PersonalTopicsContextProvider } from './PersonalTopicsContextProvider';
import { TopicList } from './TopicList';
import { TopicSubmissionToggle } from './TopicSubmissionToggle';

const SideBySide = styled.div({
  display: 'flex',
  alignItems: 'baseline',
  flexDirection: 'row',
  gap: 8,

  '& > *:first-child': {
    flex: '1',
  },
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
    <ButtonGroup fluid>
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
        role="dialog"
        aria-labelledby={headerId}
        aria-modal="true"
        trigger={
          <ButtonWithIcon primary>
            <Icon name="idea" />
            {t('personalSpace.submitProposal', 'Submit a topic')}
          </ButtonWithIcon>
        }
      >
        <Modal.Header id={headerId}>
          <SideBySide ref={headerRef}>
            <div>
              <Icon name="user" />
              {t('personalSpace.title', 'Personal Space')}
            </div>
            <Tooltip
              content={t(
                'personalSpace.explanation',
                'The Personal Space is a place to prepare a topic before they are submitted to the topic queue. Proposals remain private until they are submitted.'
              )}
            >
              <Button icon="help" circular basic floated="right" />
            </Tooltip>
          </SideBySide>
        </Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <FocusOn shards={[headerRef, actionsRef]} scrollLock={false}>
              <PersonalTopicsContextProvider>
                <TopicList />
              </PersonalTopicsContextProvider>
            </FocusOn>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <div ref={actionsRef}>
            <AutoFocusInside className="actions">
              <InFocusGuard>
                <Button basic positive onClick={() => setOpen(false)}>
                  {t('personalSpace.close', 'Close')}
                </Button>
              </InFocusGuard>
            </AutoFocusInside>
          </div>
        </Modal.Actions>
      </Modal>

      {canModerate && <TopicSubmissionToggle />}
    </ButtonGroup>
  );
}
