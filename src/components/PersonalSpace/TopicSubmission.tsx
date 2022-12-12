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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useTranslation } from 'react-i18next';
import { Icon } from 'semantic-ui-react';
import {
  useCreateTopicSubmissionMutation,
  usePowerLevels,
  useSpaceMembers,
} from '../../store';
import { ButtonWithIcon } from '../ButtonWithIcon';
import { ConfirmDeleteDialog } from '../ConfirmDialog';
import { StickyNote, StickyNoteButton } from '../StickyNote';
import { Tooltip } from '../Tooltip';
import { usePersonalTopics } from './PersonalTopicsContextProvider';
import { PersonalTopic } from './types';

export function TopicSubmission({ topic }: { topic: PersonalTopic }) {
  const { canSubmitTopic } = usePowerLevels();
  const { t } = useTranslation();
  const { widgetParameters } = useWidgetApi();
  const { lookupDisplayName } = useSpaceMembers();

  const deleteText = t('personalSpace.topic.delete.title', 'Delete topic');

  const { removeTopic, updateTopic, isValidTopic } = usePersonalTopics();

  const [createTopicSubmission, { isLoading: isSubmitting }] =
    useCreateTopicSubmissionMutation();

  const onSubmitTopic = async () => {
    try {
      const { event_id } = await createTopicSubmission({
        title: topic.title,
        description: topic.description,
      }).unwrap();

      // mark as submitted
      updateTopic(topic.localId, { topicId: event_id });
    } catch {
      // empty
    }
  };

  const isSubmitted = topic.topicId !== undefined;

  return (
    <StickyNote
      key={topic.localId}
      onChange={
        !isSubmitted ? (patch) => updateTopic(topic.localId, patch) : undefined
      }
      headerSlot={
        !isSubmitted && (
          <Tooltip content={deleteText}>
            {/* div is required to show the tooltip */}
            <div>
              <ConfirmDeleteDialog
                title={t(
                  'personalSpace.topic.delete.modal.header',
                  'Delete the topic suggestion?'
                )}
                message={t(
                  'personalSpace.topic.delete.modal.content',
                  'Do you want to delete your topic suggestion?'
                )}
                onDelete={() => removeTopic(topic.localId)}
              >
                <StickyNoteButton
                  icon="trash"
                  type="button"
                  aria-label={deleteText}
                />
              </ConfirmDeleteDialog>
            </div>
          </Tooltip>
        )
      }
      title={topic.title}
      description={topic.description}
      author={lookupDisplayName(widgetParameters.userId ?? '')}
    >
      {isSubmitted ? (
        <ButtonWithIcon
          disabled
          basic
          color="black"
          type="button"
          fluid
          loading={isSubmitting}
        >
          <Icon name="check" />
          {t('personalSpace.topic.alreadySubmitted', 'Already Submitted')}
        </ButtonWithIcon>
      ) : (
        <ButtonWithIcon
          disabled={!isValidTopic(topic) || !canSubmitTopic}
          primary
          type="button"
          fluid
          loading={isSubmitting}
          onClick={onSubmitTopic}
        >
          <Icon name="send" />
          {t('personalSpace.topic.submit', 'Submit')}
        </ButtonWithIcon>
      )}
    </StickyNote>
  );
}
