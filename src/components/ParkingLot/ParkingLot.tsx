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

import { DispatchWithoutAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Segment } from 'semantic-ui-react';
import { ParkingLotEntry } from '../../lib/events';
import {
  useDeleteTopicMutation,
  useSelectNextTopicMutation,
  useUpdateTopicMutation,
} from '../../store';
import { PersonalSpace } from '../PersonalSpace';
import { styled } from '../StyledComponentsThemeProvider';
import { SubmittedTopics } from '../SubmittedTopics';
import { Tooltip } from '../Tooltip';
import { TopicList } from './TopicList';

const Container = styled(Segment)<{ open: boolean }>(({ open }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  '&&&': open
    ? {}
    : {
        paddingLeft: 0,
        paddingRight: 0,
        marginLeft: 0,
        marginRight: 0,
      },
}));

const IconButton = styled(Button)(({ theme }) => ({
  '&&&&': {
    fontSize: '2em',
    margin: 0,
    padding: 0,
    borderColor: 'transparent',
    boxShadow: 'none',
    verticalAlign: 'middle',
    color: theme.type === 'dark' ? 'white !important' : 'black !important',
  },
}));

const Title = styled.div({
  marginBottom: '1em',
  fontWeight: 'bold',
});

type ParkingLotProps = {
  topics: ParkingLotEntry[];
  open?: boolean;
  onImageClick?: DispatchWithoutAction;
};

export function ParkingLot({ topics, open, onImageClick }: ParkingLotProps) {
  const { t } = useTranslation();
  const [selectNextTopic] = useSelectNextTopicMutation();
  const [deleteTopic] = useDeleteTopicMutation();
  const [updateTopic] = useUpdateTopicMutation();

  return (
    <Container open={open}>
      <Tooltip
        suppress={!open}
        content={t(
          'parkingLot.explanation',
          'The Parking Lot collects topics before they are placed on the timetable. In addition, it allows to move sessions out of the timetable or to store sessions for later consideration.'
        )}
      >
        <Title>
          <IconButton icon="parking" basic size="big" onClick={onImageClick} />
          {open && t('parkingLot.title', 'Parking Lot')}
        </Title>
      </Tooltip>

      {open && (
        <>
          <TopicList
            topics={topics}
            onDeleteTopic={(topicId) => deleteTopic({ topicId })}
            onTopicChange={(topicId, changes) =>
              updateTopic({ topicId, changes })
            }
          />

          <SubmittedTopics onSelectNextTopic={selectNextTopic} />
          <PersonalSpace />
        </>
      )}
    </Container>
  );
}
