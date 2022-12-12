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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Message } from 'semantic-ui-react';
import { usePowerLevels } from '../../store';
import { ButtonWithIcon } from '../ButtonWithIcon';
import { styled } from '../StyledComponentsThemeProvider';
import { usePersonalTopics } from './PersonalTopicsContextProvider';
import { TopicSubmission } from './TopicSubmission';

const TopicContainer = styled.div(({ theme }) => ({
  display: 'flex',
  gap: 16,
  padding: 16,
  flexWrap: 'wrap',
  background: theme.pageBackground,
  border: `1px solid ${theme.borderColor}`,
  borderRadius: 8,

  '& > *': {
    minWidth: 'min(100%, 400px)',
    maxWidth: '400px',
  },
}));

export function TopicList() {
  const { canParticipantsSubmitTopics } = usePowerLevels();
  const { t } = useTranslation();

  const { topics, createTopic } = usePersonalTopics();

  return (
    <>
      {!canParticipantsSubmitTopics && (
        <Message
          icon="info circle"
          header={t(
            'personalSpace.submissionClosed.title',
            'Submission closed'
          )}
          content={t(
            'personalSpace.submissionClosed.instructions',
            'Topic submission is not open yet, but you can already prepare your topics and submit them later.'
          )}
        />
      )}

      <TopicContainer>
        {topics.map((topic) => (
          <TopicSubmission key={topic.localId} topic={topic} />
        ))}
        <ButtonWithIcon basic onClick={createTopic} primary fluid>
          <Icon name="plus" />
          {t('personalSpace.topic.create', 'Create new topic')}
        </ButtonWithIcon>
      </TopicContainer>
    </>
  );
}
