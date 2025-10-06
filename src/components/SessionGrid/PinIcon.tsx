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
import { Box } from '@mui/material';
import { PushPin as MuiPinIcon } from '@mui/icons-material';
import { useGetTopicQuery } from '../../store';
import { Tooltip } from '../Tooltip/Tooltip';

export function PinIcon({ topicId }: { topicId: string }) {
  const { t } = useTranslation();
  const { data } = useGetTopicQuery({ topicId });
  const topic = data?.topic;

  const tooltipText = t(
    'topic.pinIcon',
    'This topic is scheduled for this period'
  );

  return (
    <>
      {topic?.content.pinned ? (
        <Tooltip content={tooltipText}>
          <Box sx={{ alignSelf: 'end' }}>
            <MuiPinIcon aria-label={tooltipText} fontSize="small" />
          </Box>
        </Tooltip>
      ) : undefined}
    </>
  );
}
