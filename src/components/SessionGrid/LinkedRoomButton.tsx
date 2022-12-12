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

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  selectLinkedRoomForTopic,
  useGetLinkedRoomsQuery,
  useGetSessionGridQuery,
  useGetTopicQuery,
  usePowerLevels,
  useRoomNavigation,
} from '../../store';
import { LinkRoomDialog } from '../LinkRoomDialog';
import { StickyNoteButton } from '../StickyNote';
import { Tooltip } from '../Tooltip';

type LinkedRoomButtonProps = { topicId: string };

export function LinkedRoomButton({ topicId }: LinkedRoomButtonProps) {
  const { t } = useTranslation();
  const { canModerate } = usePowerLevels();
  const { data: topic, isSuccess: isTopicLoaded } = useGetTopicQuery({
    topicId,
  });
  const { data: linkedRoomsState, isLoading: isLinkedRoomsLoading } =
    useGetLinkedRoomsQuery();
  const { data: sessionGridEvent } = useGetSessionGridQuery();

  const { navigateToRoom } = useRoomNavigation();

  const linkedRoom =
    topic?.topic && linkedRoomsState
      ? selectLinkedRoomForTopic(
          linkedRoomsState,
          topic.topic.state_key,
          sessionGridEvent?.event?.state_key
        )
      : undefined;

  if (linkedRoom || !canModerate) {
    const switchToRoomLabel = t(
      'topic.switchToRoom',
      'Switch to the session room'
    );
    return (
      <Tooltip content={switchToRoomLabel}>
        <StickyNoteButton
          icon="sign-in"
          disabled={!linkedRoom}
          aria-label={switchToRoomLabel}
          onClick={() => {
            if (linkedRoom) {
              navigateToRoom(linkedRoom.state_key);
            }
          }}
        />
      </Tooltip>
    );
  }

  if (isTopicLoaded && !isLinkedRoomsLoading) {
    return (
      <LinkRoomDialog topicId={topicId}>
        <StickyNoteButton
          icon="exclamation triangle"
          negative
          content={t('topic.linkRoom', 'Link Room')}
        />
      </LinkRoomDialog>
    );
  }

  return <React.Fragment />;
}
