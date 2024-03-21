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

import { Trans, useTranslation } from 'react-i18next';
import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Segment,
} from 'semantic-ui-react';
import { ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION } from '../../lib/events';
import {
  useHasRoomEncryptionQuery,
  usePatchPowerLevelsMutation,
  usePatchRoomHistoryVisibilityMutation,
  usePowerLevels,
  useSetupLobbyRoomWidgetsMutation,
  useSetupSessionGridMutation,
} from '../../store';
import { ConfirmDialog } from '../ConfirmDialog';

function ModeratorWelcomeLayout() {
  const { t } = useTranslation();
  const [setupSessionGrid] = useSetupSessionGridMutation();
  const [patchPowerLevels] = usePatchPowerLevelsMutation();
  const [patchRoomHistoryVisibility] = usePatchRoomHistoryVisibilityMutation();
  const [setupLobbyRoomWidgets] = useSetupLobbyRoomWidgetsMutation();
  const { data: hasRoomEncryption, isLoading } = useHasRoomEncryptionQuery({});

  async function handleSetup() {
    const { event } = await setupSessionGrid().unwrap();
    const roomId = event.state_key;

    await patchPowerLevels({
      roomId,
      changes: {
        events: { [ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION]: 50 },
      },
    }).unwrap();

    await patchRoomHistoryVisibility({
      roomId,
      changes: {
        history_visibility: 'shared',
      },
    }).unwrap();

    await setupLobbyRoomWidgets({ roomId }).unwrap();
  }

  const setupTitle = t('welcome.setup', 'Setup BarCamp');

  return (
    <>
      <p>
        {t(
          'welcome.moderatorInstructions',
          'The BarCamp widget was installed into the Lobby room – the Lobby room is used to plan the sessions of the BarCamp. Next a moderator has to set up the Lobby room and configure the tracks and time slots of the agenda.'
        )}
      </p>

      {hasRoomEncryption ? (
        <ConfirmDialog
          title={t('welcome.encryptedRoom.title', 'Encrypted room')}
          message={
            <Trans i18nKey="welcome.encryptedRoom.message">
              <p>Do you really want to setup the BarCamp in this room?</p>

              <p>
                The current room is using encryption. In encrypted rooms,
                participants that later join are unable to see the message
                history.
              </p>

              <p>
                As an alternative you can create a new lobby room and explicitly
                disabled “end-to-end encryption” on creation.
              </p>
            </Trans>
          }
          onConfirm={handleSetup}
          confirmTitle={setupTitle}
        >
          <Button primary fluid loading={isLoading}>
            {setupTitle}
          </Button>
        </ConfirmDialog>
      ) : (
        <Button primary fluid onClick={handleSetup} loading={isLoading}>
          {setupTitle}
        </Button>
      )}
    </>
  );
}

function ParticipantWelcomeLayout() {
  const { t } = useTranslation();

  return (
    <p>
      {t(
        'welcome.participantInstructions',
        'The BarCamp widget is not yet configured. Please wait till a moderator has configured the widget.'
      )}
    </p>
  );
}

export function WelcomeLayout() {
  const { canModerate } = usePowerLevels();
  const { t } = useTranslation();

  return (
    <Container>
      <Segment>
        <Grid stackable>
          <Grid.Column width={4} textAlign="center">
            <Icon name="clock" size="massive" />
          </Grid.Column>
          <Grid.Column width={12}>
            <Header as="h1">
              {t('welcome.title', 'Matrix BarCamp Widget')}
            </Header>
            <p>
              {t(
                'welcome.introduction',
                "A BarCamp is an open, participatory workshop-event with no fixed agenda. The participants suggest discussion topics, place them together on the agenda, and discuss them in small sessions. The event's agenda is planned with time slots, which can either be common events in that all participants can join, or session slots where topics can be discussed in parallel. Participants can choose freely on which topics they want to participate."
              )}
            </p>

            {canModerate ? (
              <ModeratorWelcomeLayout />
            ) : (
              <ParticipantWelcomeLayout />
            )}
          </Grid.Column>
        </Grid>
      </Segment>
    </Container>
  );
}
