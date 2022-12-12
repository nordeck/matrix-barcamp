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
import { Button } from 'semantic-ui-react';
import { ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION } from '../../lib/events';
import { usePatchPowerLevelsMutation, usePowerLevels } from '../../store';
import { Tooltip } from '../Tooltip';

export function TopicSubmissionToggle() {
  const { t } = useTranslation();
  const { canParticipantsSubmitTopics } = usePowerLevels();
  const [patchPowerLevels] = usePatchPowerLevelsMutation();
  const submitToggleTitle = canParticipantsSubmitTopics
    ? t(
        'personalSpace.submission.close',
        'Close topic submission for participants'
      )
    : t(
        'personalSpace.submission.open',
        'Open topic submission for participants'
      );

  return (
    <Tooltip content={submitToggleTitle}>
      <Button
        aria-label={submitToggleTitle}
        icon={canParticipantsSubmitTopics ? 'lock open' : 'lock'}
        toggle
        active={canParticipantsSubmitTopics}
        onClick={() =>
          patchPowerLevels({
            changes: {
              events: {
                [ROOM_EVENT_BARCAMP_TOPIC_SUBMISSION]:
                  canParticipantsSubmitTopics ? 50 : 0,
              },
            },
          })
        }
      />
    </Tooltip>
  );
}
