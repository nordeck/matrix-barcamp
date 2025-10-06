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
import { Card, CardContent, Typography, Stack } from '@mui/material';
import { LocalParking as ParkingIcon } from '@mui/icons-material';
import { ParkingLotEntry } from '../../lib/events';
import {
  useDeleteTopicMutation,
  useSelectNextTopicMutation,
  useUpdateTopicMutation,
} from '../../store';
import { PersonalSpace } from '../PersonalSpace';
import { SubmittedTopics } from '../SubmittedTopics';
import { Tooltip } from '../Tooltip';
import { TopicList } from './TopicList';

type ParkingLotProps = {
  topics: ParkingLotEntry[];
};

export function ParkingLot({ topics }: ParkingLotProps) {
  const { t } = useTranslation();
  const [selectNextTopic] = useSelectNextTopicMutation();
  const [deleteTopic] = useDeleteTopicMutation();
  const [updateTopic] = useUpdateTopicMutation();

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Tooltip
          content={t(
            'parkingLot.explanation',
            'The Parking Lot collects topics before they are placed on the timetable. In addition, it allows to move sessions out of the timetable or to store sessions for later consideration.'
          )}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, fontWeight: 'bold' }}>
            <ParkingIcon fontSize="large" />
            <Typography variant="h6" component="h2">
              {t('parkingLot.title', 'Parking Lot')}
            </Typography>
          </Stack>
        </Tooltip>

        <TopicList
          topics={topics}
          onDeleteTopic={(topicId) => deleteTopic({ topicId })}
          onTopicChange={(topicId, changes) => updateTopic({ topicId, changes })}
        />

        <Stack spacing={2} sx={{ mt: 'auto' }}>
          <SubmittedTopics onSelectNextTopic={selectNextTopic} />
          <PersonalSpace />
        </Stack>
      </CardContent>
    </Card>
  );
}
