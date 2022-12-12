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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'semantic-ui-react';
import { TimeSlotTypes } from '../../lib/events';
import { Tooltip } from '../Tooltip';

export function AddTimeSlotButton({
  onAddTimeSlot,
}: {
  onAddTimeSlot: (timeSlotType: TimeSlotTypes) => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const label = t(
    'sessionGrid.timeSlot.createSessionsTimeSlot',
    'Create a time slot'
  );

  return (
    // We have some extra logic to suppress the tooltip while the dropdown is
    // open. Otherwise it behaves a bit strange
    <Tooltip content={label} suppress={isOpen}>
      <Dropdown
        selectOnNavigation={false}
        icon={'plus'}
        className="button icon large"
        floating
        value={''}
        aria-label={label}
        trigger={<></>}
        options={[
          { key: 'sessions', text: label, value: 'sessions' },
          {
            key: 'common-event',
            text: t(
              'sessionGrid.timeSlot.createCommonEventTimeSlot',
              'Create a common event'
            ),
            value: 'common-event',
          },
        ]}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(event, data) => {
          if (event.type === 'blur') {
            // Ignore value if the user cancels choosing an option
            return;
          }

          if (data.value === 'common-event') {
            onAddTimeSlot('common-event');
          } else if (data.value === 'sessions') {
            onAddTimeSlot('sessions');
          }
        }}
      />
    </Tooltip>
  );
}
