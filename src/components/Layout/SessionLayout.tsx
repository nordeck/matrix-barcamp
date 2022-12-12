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
import { Button, Icon, Loader, Segment } from 'semantic-ui-react';
import { Session, TimeSlot, Track } from '../../lib/events';
import {
  useGetRoomNameQuery,
  useGetTopicQuery,
  useRoomNavigation,
  useSpaceMembers,
} from '../../store';
import { StickyNote } from '../StickyNote';
import { styled } from '../StyledComponentsThemeProvider';

const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  padding: 8,
});

const Center = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
}));

const Header = styled.div(({ theme }) => ({
  display: 'flex',
  marginBottom: '1rem',
  alignItems: 'center',
  gap: 8,
}));

const OverflowEllipsis = styled.div({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const Secondary = styled.span(({ theme }) => ({
  color: theme.secondaryText,
}));

export function SessionLayout({
  sessionGridId,
  timeSlots,
  tracks,
  session,
}: {
  sessionGridId: string;
  timeSlots: TimeSlot[];
  tracks: Track[];
  session: Session;
}) {
  const { t } = useTranslation();
  const { data } = useGetTopicQuery({ topicId: session.topicId });
  const track = tracks.find((t) => t.id === session.trackId);
  const timeSlot = timeSlots.find((t) => t.id === session.timeSlotId);
  const { lookupDisplayName } = useSpaceMembers();
  const loading = !data || !track || !timeSlot;
  const { navigateToRoom } = useRoomNavigation();
  const { data: roomNameData } = useGetRoomNameQuery({ roomId: sessionGridId });

  return (
    <Container>
      <div>
        <Button
          fluid
          basic
          positive
          disabled={loading}
          onClick={() => navigateToRoom(sessionGridId)}
        >
          {t('sessionLayout.returnToLobby', 'Return to “{{roomName}}”', {
            roomName: roomNameData?.event?.content.name ?? 'Lobby',
          })}
        </Button>
      </div>

      <Segment>
        {loading ? (
          <Center>
            <Loader active inline />
          </Center>
        ) : (
          <>
            <Header>
              <Icon className={track.icon} size="big" />

              <OverflowEllipsis>
                <strong>{track.name}</strong>
                <br />
                <Secondary>
                  {t(
                    'sessionLayout.timeslotTimes',
                    '{{startTime, datetime}}–{{endTime, datetime}}',
                    {
                      startTime: new Date(timeSlot.startTime),
                      endTime: new Date(timeSlot.endTime),
                      formatParams: {
                        startTime: {
                          hour: 'numeric',
                          minute: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          day: 'numeric',
                        },
                        endTime: { hour: 'numeric', minute: 'numeric' },
                      },
                    }
                  )}
                </Secondary>
              </OverflowEllipsis>
            </Header>

            <StickyNote
              title={data.topic.content.title}
              description={data.topic.content.description}
              author={lookupDisplayName(
                data.topic.content.authors[0]?.id ?? ''
              )}
            />
          </>
        )}
      </Segment>
    </Container>
  );
}
