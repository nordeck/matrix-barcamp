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
  Button,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { Session, TimeSlot, Track } from '../../lib/events';
import {
  useGetRoomNameQuery,
  useGetTopicQuery,
  useRoomNavigation,
  useSpaceMembers,
} from '../../store';
import { StickyNote } from '../StickyNote';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getIconByName } from '../IconPicker';

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        p: 1,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="success"
          disabled={loading}
          onClick={() => navigateToRoom(sessionGridId)}
        >
          {t('sessionLayout.returnToLobby', 'Return to "{{roomName}}"', {
            roomName: roomNameData?.event?.content.name ?? 'Lobby',
          })}
        </Button>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FontAwesomeIcon icon={getIconByName(track!.icon)} size="xs" />
                <Box sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0
                }}>
                  <Typography variant="h6" component="strong">
                    {track!.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(
                      'sessionLayout.timeslotTimes',
                      '{{startTime, datetime}}–{{endTime, datetime}}',
                      {
                        startTime: new Date(timeSlot!.startTime),
                        endTime: new Date(timeSlot!.endTime),
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
                  </Typography>
                </Box>
              </Stack>

              <StickyNote
                title={data!.topic.content.title}
                description={data!.topic.content.description}
                author={lookupDisplayName(
                  data!.topic.content.authors[0]?.id ?? ''
                )}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
