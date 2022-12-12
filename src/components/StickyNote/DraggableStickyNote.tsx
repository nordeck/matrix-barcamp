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

import React, { ReactNode } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { useGetTopicQuery, useSpaceMembers } from '../../store';
import { styled } from '../StyledComponentsThemeProvider';
import { DeleteTopicButton } from './DeleteTopicButton';
import { ExpandableStickyNote } from './ExpandableStickyNote';
import { TopicChanges } from './StickyNote';

const DraggableContainer = styled.div({
  paddingBottom: 8,
  paddingRight: 8,
});

export type DraggableStickyNoteProps = {
  topicId: string;
  index?: number;
  collapsed?: boolean | number;
  draggable?: boolean;
  onUpdate?: (changes: TopicChanges) => void;
  onDelete?: () => void;
  headerSlot?: ReactNode;
  expandedHeaderSlot?: ReactNode;
  children?: ReactNode;
};

export function DraggableStickyNote({
  topicId,
  index,
  collapsed,
  draggable = true,
  onUpdate,
  onDelete,
  headerSlot,
  expandedHeaderSlot,
  children,
}: DraggableStickyNoteProps) {
  const { data } = useGetTopicQuery({ topicId });
  const { lookupDisplayName } = useSpaceMembers();
  const topic = data?.topic;

  if (!topic) {
    // TODO: loading spinner? -> skeleton sticky note
    return <React.Fragment />;
  }

  return (
    <Draggable
      draggableId={topicId}
      index={index ?? 0}
      isDragDisabled={!draggable}
    >
      {(provided) => (
        <DraggableContainer
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <ExpandableStickyNote
            author={lookupDisplayName(topic.content.authors[0]?.id ?? '')}
            title={topic.content.title}
            description={topic.content.description}
            collapsed={collapsed}
            onUpdate={onUpdate}
            headerSlot={headerSlot}
            expandedHeaderSlot={
              <>
                {onDelete && (
                  <DeleteTopicButton
                    topicTitle={topic.content.title}
                    onDelete={onDelete}
                  />
                )}
                {expandedHeaderSlot}
              </>
            }
          >
            {children}
          </ExpandableStickyNote>
        </DraggableContainer>
      )}
    </Draggable>
  );
}
