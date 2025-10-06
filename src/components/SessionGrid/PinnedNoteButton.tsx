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
import { PushPin } from '@mui/icons-material';
import { useGetTopicQuery } from '../../store';
import { StickyNoteButton, TopicChanges } from '../StickyNote';
import { Tooltip } from '../Tooltip';

export type PinnedNoteProps = {
  onUpdate: (changes: TopicChanges) => void;
  topicId: string;
};

export function PinnedNoteButton(props: PinnedNoteProps) {
  const { t } = useTranslation();
  const { data } = useGetTopicQuery({ topicId: props.topicId });
  const topic = data?.topic;

  const pinButtonText = topic?.content.pinned
    ? t('topic.unpin', 'Release period')
    : t('topic.pin', 'Fix period');

  return (
    <Tooltip content={pinButtonText} placement="bottom-start">
      <StickyNoteButton
        size="large"
        color={topic?.content.pinned ? "primary" : "inherit"}
        onClick={() => props.onUpdate({ pinned: !topic?.content.pinned })}
        aria-label={pinButtonText}
      >
        <PushPin />
      </StickyNoteButton>
    </Tooltip>
  );
}
