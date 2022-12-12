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
import { Button } from 'semantic-ui-react';
import { Track } from '../../lib/events';
import { ConfirmDeleteDialog } from '../ConfirmDialog';
import { Tooltip } from '../Tooltip';

export function DeleteTrackButton({
  track,
  onDelete,
}: {
  track: Track;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const deleteTrackTitle = t('track.delete.title', 'Delete track');
  const trigger = (
    <Button
      aria-label={deleteTrackTitle}
      circular
      compact
      disabled={onDelete === undefined}
      icon="trash"
    />
  );

  if (!onDelete) {
    return trigger;
  }

  return (
    <Tooltip content={deleteTrackTitle}>
      {/* div is required to show the tooltip */}
      <div>
        <ConfirmDeleteDialog
          title={t('track.delete.modal.header', 'Delete the track?')}
          message={t(
            'track.delete.modal.content',
            'Do you want to delete the track “{{name}}”? The topics that are currently assigned to this track, if any, will be moved to the parking lot.',
            { name: track.name }
          )}
          onDelete={onDelete}
        >
          {trigger}
        </ConfirmDeleteDialog>
      </div>
    </Tooltip>
  );
}
