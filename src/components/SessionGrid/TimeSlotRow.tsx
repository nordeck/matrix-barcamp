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
import { PropsWithChildren } from 'react';
import {
  Draggable,
  DraggableProvidedDragHandleProps,
} from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { Session, TimeSlot, Track } from '../../lib/events';
import { InlineDateTimeEdit } from '../InlineDateTimeEdit';
import { InlineDurationEdit } from '../InlineDurationEdit';
import { TopicChanges } from '../StickyNote';
import { styled } from '../StyledComponentsThemeProvider';
import { CommonEventSlot, CommonEventTimeSlotChanges } from './CommonEventSlot';
import { DeleteTimeSlotButton } from './DeleteTimeSlotButton';
import { EditModeGuard, useEditMode } from './EditModeContext';
import { SessionSlot } from './SessionSlot';

const Container = styled.div({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
});

const Row = styled.tr<{ isDragging: boolean }>(({ isDragging, theme }) => ({
  background: isDragging ? theme.pageBackgroundModal : undefined,

  // Disable sticky headers while a row is dragged, otherwise the row looks odd.
  '&&& > th': {
    position: isDragging ? 'static' : undefined,
  },
}));

const NoWrap = styled.div({
  whiteSpace: 'nowrap',
});

const FlexGrow = styled.div({
  flex: 1,
});

export type TimeSlotChanges = { durationMinutes?: number; startTime?: string };

export function TimeSlotTitle({
  timeSlot,
  dragHandleProps,
  firstEvent,
  onUpdate,
  onDelete,
}: {
  timeSlot: TimeSlot;
  dragHandleProps?: DraggableProvidedDragHandleProps | undefined;
  firstEvent: boolean;
  onUpdate: (changes: TimeSlotChanges) => void;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const { canEditGrid } = useEditMode();
  const startTime = DateTime.fromISO(timeSlot.startTime);
  const endTime = DateTime.fromISO(timeSlot.endTime);
  const duration = endTime.diff(startTime);

  return (
    <th
      scope="row"
      {...dragHandleProps}
      role="rowheader"
      aria-label={t(
        'sessionGrid.timeSlot.rowLabel',
        '{{startTime, datetime}} {{duration}} min.',
        {
          startTime: startTime.toJSDate(),
          duration: duration.as('minute'),
          formatParams: {
            startTime: { hour: 'numeric', minute: 'numeric' },
          },
        }
      )}
    >
      {/* @ts-ignore - styled-components JSX component type issue */}
      <Container>
        {/* @ts-ignore - styled-components JSX component type issue */}
        <FlexGrow>
          {/* @ts-ignore - styled-components JSX component type issue */}
          <NoWrap>
            <InlineDateTimeEdit
              label={t(
                'sessionGrid.timeSlot.dateTimeInputLabel',
                'Start day and time'
              )}
              value={timeSlot.startTime}
              onChange={(startTime) => onUpdate({ startTime })}
              readOnly={!canEditGrid || !firstEvent}
            />
          </NoWrap>
          {/* @ts-ignore - styled-components JSX component type issue */}
          <NoWrap>
            <InlineDurationEdit
              minutes={duration.as('minute')}
              onChange={(durationMinutes) => onUpdate({ durationMinutes })}
              readOnly={!canEditGrid}
            />
          </NoWrap>
        </FlexGrow>
        <EditModeGuard>
          <DeleteTimeSlotButton timeSlot={timeSlot} onDelete={onDelete} />
        </EditModeGuard>
      </Container>
    </th>
  );
}

export type TimeSlotRowProps = PropsWithChildren<{
  index: number;
  timeSlot: TimeSlot;
  tracks: Track[];
  sessions: Session[];
  onCommonEventChange: (
    timeSlotId: string,
    changes: CommonEventTimeSlotChanges
  ) => void;
  onTopicChange: (topicId: string, changes: TopicChanges) => void;
  onDelete?: () => void;
  onDeleteTopic: (topicId: string) => void;
  onTimeSlotChange: (timeSlotId: string, changes: TimeSlotChanges) => void;
}>;

export function TimeSlotRow({
  index,
  timeSlot,
  tracks,
  sessions,
  children,
  onCommonEventChange,
  onTopicChange,
  onDelete,
  onDeleteTopic,
  onTimeSlotChange,
}: TimeSlotRowProps) {
  const { canEditGrid } = useEditMode();

  return (
    // @ts-ignore - React Beautiful DnD type compatibility issue
    <Draggable
      draggableId={timeSlot.id}
      index={index}
      isDragDisabled={!canEditGrid}
    >
      {(provided, snapshot) => {
        // @ts-ignore - styled-components JSX component type issue
        return (
        // @ts-ignore - styled-components JSX component type issue
        <Row
          ref={provided.innerRef}
          isDragging={snapshot.isDragging}
          {...provided.draggableProps}
        >
          <TimeSlotTitle
            firstEvent={index === 0}
            dragHandleProps={provided.dragHandleProps ?? undefined}
            timeSlot={timeSlot}
            onDelete={onDelete}
            onUpdate={(changes) => onTimeSlotChange(timeSlot.id, changes)}
          />

          {timeSlot.type === 'sessions' &&
            tracks.map((t) => (
              <SessionSlot
                onTopicChange={onTopicChange}
                onDeleteTopic={onDeleteTopic}
                key={`${timeSlot.id}-${t.id}`}
                timeSlot={timeSlot}
                track={t}
                topicId={
                  sessions.find(
                    (session) =>
                      session.timeSlotId === timeSlot.id &&
                      session.trackId === t.id
                  )?.topicId
                }
              />
            ))}

          {timeSlot.type === 'common-event' && (
            <CommonEventSlot
              timeSlot={timeSlot}
              tracks={tracks}
              onChange={onCommonEventChange}
            />
          )}

          {children}
        </Row>
        );
      }}
    </Draggable>
  );
}
