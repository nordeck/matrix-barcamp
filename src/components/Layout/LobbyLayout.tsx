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
import { ParkingLotEntry, Session, TimeSlot, Track } from '../../lib/events';
import {
  useMoveTimeSlotMutation,
  useMoveTopicToParkingAreaMutation,
  useMoveTopicToSessionMutation,
} from '../../store';
import { DragAndDropProvider } from '../DragAndDropProvider';
import { ParkingLot } from '../ParkingLot';
import { SessionGrid } from '../SessionGrid';
import { styled } from '../StyledComponentsThemeProvider';

const Container = styled.div({
  display: 'flex',
  height: '100vh',
  gap: 8,
  // Make sure that shadows are not cut off
  paddingRight: 1,
  paddingBottom: 2,
});

const LeftContainer = styled.div({
  flex: 1,
  minWidth: 0,
});

const RightContainer = styled.div({
  width: 250,
});

export function LobbyLayout({
  timeSlots,
  tracks,
  sessions,
  parkingLotTopics,
}: {
  timeSlots: TimeSlot[];
  tracks: Track[];
  sessions: Session[];
  parkingLotTopics: ParkingLotEntry[];
}) {
  const [moveTopicToParkingArea] = useMoveTopicToParkingAreaMutation();
  const [moveTopicToSession] = useMoveTopicToSessionMutation();
  const [moveTimeSlot] = useMoveTimeSlotMutation();

  return (
    <DragAndDropProvider
      onMoveTimeSlot={(timeSlotId, toIndex) => {
        moveTimeSlot({ timeSlotId, toIndex });
      }}
      onMoveTopicToParkingArea={(topicId, toIndex) => {
        moveTopicToParkingArea({ topicId, toIndex });
      }}
      onMoveTopicToSession={(topicId, timeSlotId, trackId) => {
        moveTopicToSession({ topicId, timeSlotId, trackId });
      }}
    >
      <Container>
        <LeftContainer>
          <SessionGrid
            tracks={tracks}
            timeSlots={timeSlots}
            sessions={sessions}
          />
        </LeftContainer>
        <RightContainer>
          <ParkingLot topics={parkingLotTopics} />
        </RightContainer>
      </Container>
    </DragAndDropProvider>
  );
}
