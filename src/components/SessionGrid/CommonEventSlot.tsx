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
import { CommonEventTimeSlot, Track } from '../../lib/events';
import { IconPicker } from '../IconPicker';
import { InlineTextEdit } from '../InlineTextEdit';
import { styled } from '../StyledComponentsThemeProvider';
import { useEditMode } from './EditModeContext';

const CommonEventTd = styled.td(({ theme }) => ({
  background: theme.pageBackground,
  width: '100%',

  '&&': {
    verticalAlign: 'middle',
  },
}));

const CommonEventLabel = styled.div<{ trackCount: number }>(() => ({
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
}));

const Summary = styled.span({
  fontWeight: 'bold',
});

export type CommonEventTimeSlotChanges = Partial<
  Pick<CommonEventTimeSlot, 'summary' | 'icon'>
>;

export type CommonEventSlotProps = {
  timeSlot: CommonEventTimeSlot;
  tracks: Track[];

  onChange: (timeSlotId: string, changes: CommonEventTimeSlotChanges) => void;
};

export function CommonEventSlot({
  timeSlot,
  tracks,
  onChange,
}: CommonEventSlotProps) {
  const { canEditGrid } = useEditMode();
  const { t } = useTranslation();

  return (
    <CommonEventTd colSpan={tracks.length} aria-label={timeSlot.summary}>
      <CommonEventLabel trackCount={tracks.length}>
        <IconPicker
          size="big"
          icon={timeSlot.icon}
          readOnly={!canEditGrid}
          onChange={(icon) => {
            if (onChange) {
              onChange(timeSlot.id, {
                icon,
              });
            }
          }}
        />
        <Summary>
          <InlineTextEdit
            label={t(
              'sessionGrid.timeSlot.commonEvent.title',
              'Common Event Title'
            )}
            value={timeSlot.summary}
            readOnly={!canEditGrid}
            onChange={(summary) => {
              if (onChange) {
                onChange(timeSlot.id, {
                  summary,
                });
              }
            }}
          />
        </Summary>
      </CommonEventLabel>
    </CommonEventTd>
  );
}
