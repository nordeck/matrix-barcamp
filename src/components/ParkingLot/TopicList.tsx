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
import { useTranslation } from 'react-i18next';
import { ParkingLotEntry } from '../../lib/events';
import { usePowerLevels } from '../../store';
import {
  stringifyDroppableId,
  useDragAndDropContext,
} from '../DragAndDropProvider';
import { DraggableStickyNote, TopicChanges } from '../StickyNote';
import { styled } from '../StyledComponentsThemeProvider';

const List = styled.div<{ canDrop?: boolean }>(({ canDrop, theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  padding: 8,
  background: canDrop
    ? `repeating-linear-gradient(45deg, ${theme.pageBackground}, ${theme.pageBackground} 10px, transparent 10px, transparent 20px)`
    : undefined,
}));

function ParkingLotPlaceholder() {
  const { t } = useTranslation();

  return (
    <>
      {t(
        'parkingLot.placeholder',
        "You can park topics here that you don't want to place in the grid for now."
      )}
    </>
  );
}

export function TopicList({
  topics,
  onDeleteTopic,
  onTopicChange,
}: {
  topics: ParkingLotEntry[];
  onDeleteTopic: (topicId: string) => void;
  onTopicChange: (topicId: string, changes: TopicChanges) => void;
}) {
  const { t } = useTranslation();
  const { dragStart } = useDragAndDropContext();
  const { canModerate } = usePowerLevels();
  const canDrop = dragStart?.type === 'topic';

  return (
    <Droppable
      type="topic"
      droppableId={stringifyDroppableId({ type: 'parkingLot' })}
    >
      {(provided) => (
        <List
          {...provided.droppableProps}
          ref={provided.innerRef}
          canDrop={canDrop}
          role="region"
          aria-label={t('parkingLot.title', 'Parking Lot')}
        >
          {topics.length ? (
            topics.map((topic, i) => (
              <DraggableStickyNote
                topicId={topic.topicId}
                key={topic.topicId}
                index={i}
                collapsed
                draggable={canModerate}
                onDelete={
                  canModerate ? () => onDeleteTopic(topic.topicId) : undefined
                }
                onUpdate={
                  canModerate
                    ? (changes) => onTopicChange(topic.topicId, changes)
                    : undefined
                }
              />
            ))
          ) : (
            <ParkingLotPlaceholder />
          )}

          {provided.placeholder}
        </List>
      )}
    </Droppable>
  );
}
