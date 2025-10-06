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

import { Droppable } from 'react-beautiful-dnd';
import { SessionsTimeSlot, Track } from '../../lib/events';
import { usePowerLevels } from '../../store';
import {
  stringifyDroppableId,
  useDragAndDropContext,
} from '../DragAndDropProvider';
import { DraggableStickyNote, TopicChanges } from '../StickyNote';
import { styled } from '../StyledComponentsThemeProvider';
import { LinkedRoomButton } from './LinkedRoomButton';
import { PinIcon } from './PinIcon';
import { PinnedNoteButton } from './PinnedNoteButton';

const SessionSlotCell = styled.td<{ canDrop?: boolean }>(
  ({ canDrop, theme }) => ({
    background: canDrop ? 'transparent' : theme.pageBackgroundModal,
  })
);

export function SessionSlot({
  track,
  timeSlot,
  topicId,
  onTopicChange,
  onDeleteTopic,
}: {
  timeSlot: SessionsTimeSlot;
  track: Track;
  topicId: string | undefined;
  isDragging?: boolean;
  onTopicChange: (topicId: string, changes: TopicChanges) => void;
  onDeleteTopic: (topicId: string) => void;
}) {
  const { isDragging } = useDragAndDropContext();
  const { canModerate } = usePowerLevels();

  return (
    // @ts-ignore - React Beautiful DnD type compatibility issue
    <Droppable
      type="topic"
      droppableId={stringifyDroppableId({
        type: 'session',
        trackId: track.id,
        timeSlotId: timeSlot.id,
      })}
      isDropDisabled={!!topicId}
    >
      {(provided, snapshot) => {
        // @ts-ignore - styled-components JSX component type issue
        return (
        // @ts-ignore - styled-components JSX component type issue
        <SessionSlotCell
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="session"
          canDrop={isDragging && (!topicId || !!snapshot.draggingFromThisWith)}
        >
          {topicId && (
            <DraggableStickyNote
              children={<PinIcon topicId={topicId} />}
              topicId={topicId}
              collapsed={4}
              draggable={canModerate}
              onDelete={canModerate ? () => onDeleteTopic(topicId) : undefined}
              onUpdate={
                canModerate
                  ? (changes) => onTopicChange(topicId, changes)
                  : undefined
              }
              headerSlot={<LinkedRoomButton topicId={topicId} />}
              expandedHeaderSlot={
                canModerate ? (
                  <PinnedNoteButton
                    topicId={topicId}
                    onUpdate={(changes) => onTopicChange(topicId, changes)}
                  />
                ) : undefined
              }
            />
          )}

          {provided.placeholder as React.ReactNode}
        </SessionSlotCell>
        );
      }}
    </Droppable>
  );
}
