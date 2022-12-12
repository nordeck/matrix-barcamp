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
import { Container, Message } from 'semantic-ui-react';

export function NoSpaceMessage() {
  const { t } = useTranslation();

  return (
    <Container>
      <Message
        icon="exclamation triangle"
        error
        header={t(
          'notPartOfASpace.title',
          'Your Matrix room is not part of a Matrix space.'
        )}
        content={t(
          'notPartOfASpace.instructions',
          'The widget only works in rooms that belong to a space. Please create a new space, create a new room in that space, and try again.'
        )}
      />
    </Container>
  );
}
