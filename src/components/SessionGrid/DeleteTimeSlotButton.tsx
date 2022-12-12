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

import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Button } from 'semantic-ui-react';
import { TimeSlot } from '../../lib/events';
import { ConfirmDeleteDialog } from '../ConfirmDialog';
import { Tooltip } from '../Tooltip';

export function DeleteTimeSlotButton({
  onDelete,
  timeSlot,
}: {
  onDelete?: () => void;
  timeSlot: TimeSlot;
}) {
  const { t } = useTranslation();
  const deleteTimeSlotTitle = t(
    'sessionGrid.timeSlot.delete.title',
    'Delete time slot'
  );
  const startTime = DateTime.fromISO(timeSlot.startTime);

  const trigger = (
    <Button
      aria-label={deleteTimeSlotTitle}
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
    <Tooltip content={deleteTimeSlotTitle}>
      {/* div is required to show the tooltip */}
      <div>
        <ConfirmDeleteDialog
          title={t(
            'sessionGrid.timeSlot.delete.modal.header',
            'Delete the time slot?'
          )}
          message={t(
            'sessionGrid.timeSlot.delete.modal.content',
            'Do you want to delete the time slot at {{startTime, datetime}}? The topics that are currently assigned to this time slot, if any, will be moved to the parking lot.',
            {
              startTime: startTime.toJSDate(),
              formatParams: {
                startTime: { hour: 'numeric', minute: 'numeric' },
              },
            }
          )}
          onDelete={onDelete}
        >
          {trigger}
        </ConfirmDeleteDialog>
      </div>
    </Tooltip>
  );
}
