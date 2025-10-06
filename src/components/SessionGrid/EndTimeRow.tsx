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

import { last } from 'lodash';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { TimeSlot, Track } from '../../lib/events';
import { useEditMode } from './EditModeContext';

const EndTimeLabel = styled.td(({ theme }) => ({
  background: theme.pageBackground,

  '&&': {
    verticalAlign: 'middle',
    textAlign: 'center',
  },
}));

function EndTimeTitle({ timeSlot }: { timeSlot: TimeSlot }) {
  const { t } = useTranslation();
  const endTime = new Date(timeSlot.endTime);

  return (
    <th scope="row">
      {t('sessionGrid.timeSlot.endTime', '{{endTime, datetime}}', {
        endTime,

        formatParams: {
          endTime: { hour: 'numeric', minute: 'numeric' },
        },
      })}
    </th>
  );
}

export function EndTimeRow({
  timeSlots,
  tracks,
}: {
  timeSlots: TimeSlot[];
  tracks: Track[];
}) {
  const { canEditGrid } = useEditMode();
  const { t } = useTranslation();
  const lastTimeSlot = last(timeSlots);

  if (!lastTimeSlot) {
    return <></>;
  }

  return (
    <tr>
      <EndTimeTitle timeSlot={lastTimeSlot} />
      {/* @ts-ignore - styled-components JSX component type issue */}
      <EndTimeLabel colSpan={tracks.length}>
        {t('sessionGrid.timeSlot.end', 'End of the BarCamp 👋')}
      </EndTimeLabel>
      {canEditGrid && <td className="create"></td>}
    </tr>
  );
}
