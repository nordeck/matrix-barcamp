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

import { PropsWithChildren, useCallback, useRef, useState } from 'react';
import { AutoFocusInside, FocusOn, InFocusGuard } from 'react-focus-on';
import { Trans, useTranslation } from 'react-i18next';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  FormControl,
  FormLabel,
  Box,
  CircularProgress
} from '@mui/material';
import {
  useAssignLinkedRoomMutation,
  useGetSessionGridQuery,
  useGetTopicQuery,
  useHasRoomEncryptionQuery,
  usePatchRoomHistoryVisibilityMutation,
  usePatchRoomNameMutation,
  usePatchRoomTopicMutation,
  useSetupSessionRoomWidgetsMutation,
} from '../../store';
import { ConfirmDialog } from '../ConfirmDialog';
import { useId } from '../utils';
import { SelectUnassignedRoomDropdown } from './SelectUnassignedRoomDropdown';

export type LinkRoomDialogProps = PropsWithChildren<{
  topicId: string;
}>;

export function LinkRoomDialog({ children, topicId }: LinkRoomDialogProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [roomId, setRoomId] = useState<string>();
  const { data: { topic } = {} } = useGetTopicQuery({ topicId });
  const [assignLinkedRoom, { isLoading: isAssigningRoom }] =
    useAssignLinkedRoomMutation();
  const [patchRoomName, { isLoading: isPatchingRoomName }] =
    usePatchRoomNameMutation();
  const [
    patchRoomHistoryVisibility,
    { isLoading: isPatchingRoomHistoryVisibility },
  ] = usePatchRoomHistoryVisibilityMutation();
  const [patchRoomTopic, { isLoading: isPatchingRoomTopic }] =
    usePatchRoomTopicMutation();
  const [
    setupSessionRoomWidgets,
    { isLoading: isSettingUpSessionRoomWidgets },
  ] = useSetupSessionRoomWidgetsMutation();
  const { data: hasRoomEncryption, isLoading: isLoadingRoomEncryption } =
    useHasRoomEncryptionQuery({ roomId });
  const { data: sessionGridEvent } = useGetSessionGridQuery();

  const isAssigning =
    isAssigningRoom ||
    isPatchingRoomName ||
    isPatchingRoomTopic ||
    isSettingUpSessionRoomWidgets ||
    isPatchingRoomHistoryVisibility;
  const isLoading = isAssigning || isLoadingRoomEncryption;

  const handleOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (roomId && sessionGridEvent?.event?.state_key && topic) {
      try {
        await patchRoomName({
          roomId,
          changes: {
            name: topic.content.title,
          },
        }).unwrap();

        await patchRoomTopic({
          roomId,
          changes: {
            topic: topic.content.description,
          },
        }).unwrap();

        await patchRoomHistoryVisibility({
          roomId,
          changes: {
            history_visibility: 'shared',
          },
        }).unwrap();

        await setupSessionRoomWidgets({
          roomId,
          roomName: topic.content.title,
        }).unwrap();

        await assignLinkedRoom({
          roomId,
          sessionGridId: sessionGridEvent.event.state_key,
          topicId,
        }).unwrap();

        setModalOpen(false);
      } catch {
        // ignore
      }
    }
  }, [
    assignLinkedRoom,
    patchRoomName,
    patchRoomTopic,
    setupSessionRoomWidgets,
    patchRoomHistoryVisibility,
    roomId,
    sessionGridEvent?.event?.state_key,
    topic,
    topicId,
  ]);

  const headerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const headerId = useId();
  const contentId = useId();
  const assignTitle = t('linkRoomDialog.assign', 'Assign');

  return (
    <>
      <Box onClick={handleOpen} sx={{ cursor: 'pointer' }}>
        {children}
      </Box>
      <Dialog
        open={modalOpen}
        onClose={handleClose}
        aria-labelledby={headerId}
        aria-describedby={contentId}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id={headerId}>
          <div ref={headerRef}>
            {t('linkRoomDialog.title', 'Assign a Matrix room to a topic')}
          </div>
        </DialogTitle>
        <DialogContent id={contentId}>
          <div ref={formRef}>
            <FocusOn shards={[headerRef, actionsRef]} scrollLock={false}>
              <Box component="form" sx={{ mt: 1 }}>
                <Typography variant="body1" gutterBottom>
                  {t(
                    'linkRoomDialog.description',
                    'Select a Matrix room where the topic "{{topicTitle}}" should be discussed. Each Matrix room can only host a single topic.',
                    { topicTitle: topic?.content.title }
                  )}
                </Typography>
                
                <AutoFocusInside>
                  <InFocusGuard>
                    <FormControl fullWidth margin="normal">
                      <FormLabel htmlFor="room-selection">
                        {t('linkRoomDialog.room', 'Matrix Room')}
                      </FormLabel>
                      <SelectUnassignedRoomDropdown
                        roomId={roomId}
                        onChange={setRoomId}
                        id="room-selection"
                      />
                    </FormControl>
                  </InFocusGuard>
                </AutoFocusInside>
                
                <Trans i18nKey="linkRoomDialog.assignmentProcedure">
                  <Typography variant="body2" component="p" sx={{ mt: 2 }}>
                    When you assign a room, the widget will:
                  </Typography>
                  <Typography variant="body2" component="ol" sx={{ ml: 2 }}>
                    <li>Add a link to the session room to the sticky note.</li>
                    <li>Update the title and topic to match the topic.</li>
                    <li>Setup the BarCamp and the Video Conference widget.</li>
                  </Typography>
                </Trans>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  {t(
                    'linkRoomDialog.createRoomMessage',
                    'You must create a room in Element before you can assign it to a topic. Use a temporary name as a title (example: "Session 1"), disable "end-to-end encryption", and set the join rule to "Visible to space members". Tip: You can also create the rooms before the planning session starts to speed-up the assignment process.'
                  )}
                </Alert>
              </Box>
            </FocusOn>
          </div>
        </DialogContent>
        <DialogActions>
          <div ref={actionsRef}>
            <InFocusGuard>
              <Button variant="outlined" onClick={handleClose}>
                {t('linkRoomDialog.cancel', 'Cancel')}
              </Button>

              {hasRoomEncryption ? (
                <ConfirmDialog
                  title={t(
                    'linkRoomDialog.encryptedRoom.title',
                    'Encrypted room'
                  )}
                  message={
                    <Trans i18nKey="linkRoomDialog.encryptedRoom.message">
                      <Typography component="p" gutterBottom>
                        Do you really want to assign this room?
                      </Typography>

                      <Typography component="p" gutterBottom>
                        The room you are trying to assign uses encryption. In
                        encrypted rooms, participants that later join are unable
                        to see the message history.
                      </Typography>

                      <Typography component="p">
                        As an alternative you can create a new room and explicitly
                        disabled "end-to-end encryption" on creation.
                      </Typography>
                    </Trans>
                  }
                  confirmTitle={assignTitle}
                  onConfirm={handleConfirm}
                >
                  <Button 
                    variant="contained" 
                    color="primary"
                    disabled={!roomId || isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} /> : null}
                  >
                    {assignTitle}
                  </Button>
                </ConfirmDialog>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConfirm}
                  disabled={!roomId || isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} /> : null}
                >
                  {assignTitle}
                </Button>
              )}
            </InFocusGuard>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}
