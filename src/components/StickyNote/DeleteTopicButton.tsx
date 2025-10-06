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

import { useTranslation } from 'react-i18next';
import { Delete } from '@mui/icons-material';
import { ConfirmDeleteDialog } from '../ConfirmDialog';
import { Tooltip } from '../Tooltip';
import { StickyNoteButton } from './StickyNote';

export function DeleteTopicButton({
  topicTitle,
  onDelete,
}: {
  topicTitle: string;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const deleteTopicButtonText = t('topic.delete.title', 'Delete topic');
  const trigger = (
    <div>
      {/* div is required to keep the click target working */}
      <Tooltip content={deleteTopicButtonText} placement="bottom-start">
        <StickyNoteButton
          size="large"
          aria-label={deleteTopicButtonText}
        >
          <Delete />
        </StickyNoteButton>
      </Tooltip>
    </div>
  );

  if (!onDelete) {
    return trigger;
  }

  return (
    <ConfirmDeleteDialog
      title={t('topic.delete.modal.header', 'Delete the topic?')}
      message={t(
        'topic.delete.modal.content',
        'Do you want to delete the topic “{{name}}”?',
        { name: topicTitle }
      )}
      onDelete={onDelete}
    >
      {trigger}
    </ConfirmDeleteDialog>
  );
}
