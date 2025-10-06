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
import { Track } from '../../lib/events';
import { IconPicker } from '../IconPicker';
import { InlineTextEdit } from '../InlineTextEdit';
import { styled } from '../StyledComponentsThemeProvider';
import { DeleteTrackButton } from './DeleteTrackButton';
import { EditModeGuard, useEditMode } from './EditModeContext';

const Container = styled.div({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
});

const InlineTextEditContainer = styled.div({
  flex: 1,
});

export type TrackChanges = Partial<Pick<Track, 'name' | 'icon'>>;

export type TrackTitleProps = {
  track: Track;
  onChange: (trackId: string, changes: TrackChanges) => void;
  onDelete?: () => void;
};

export function TrackTitle({ track, onChange, onDelete }: TrackTitleProps) {
  const { canEditGrid } = useEditMode();
  const { t } = useTranslation();

  return (
    <th aria-label={track.name}>
      {/* @ts-ignore - styled-components JSX component type issue */}
      <Container>
        <IconPicker
          size="large"
          icon={track.icon}
          onChange={(icon) => onChange(track.id, { icon })}
          readOnly={!canEditGrid}
        />
        {/* @ts-ignore - styled-components JSX component type issue */}
        <InlineTextEditContainer>
          <InlineTextEdit
            value={track.name}
            onChange={(name) => onChange(track.id, { name })}
            readOnly={!canEditGrid}
            label={t('track.name', 'Track name')}
          />
        </InlineTextEditContainer>

        <EditModeGuard>
          <DeleteTrackButton track={track} onDelete={onDelete} />
        </EditModeGuard>
      </Container>
    </th>
  );
}
