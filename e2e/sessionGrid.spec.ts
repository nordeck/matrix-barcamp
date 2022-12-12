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

import { test } from './fixtures';

test.describe('Editing Session Grid', () => {
  test.beforeEach(async ({ aliceSessionGridWidgetPage }) => {
    await aliceSessionGridWidgetPage.setupBarCamp();
  });

  test.fixme('should allow moderators to configure the session grid', () => {
    // TODO: Setup barcamp
    // TODO: Has an initial state of a single session
    // TODO: switch to edit mode
    // TODO: Move the barcamp to a different date (different ways and verify it)
    // TODO: adding a session time slot (verify, e.g. added to the end)
    // TODO: adding a common time slot (rename, select icon, verify, e.g. added to the end)
    // TODO: change duration of a time slot (verify how everything changes, e.g. end time)
    // TODO: add a timeslot and drag it somewhere else (verify how everything changes)
    // TODO: delete a time slot (and confirm it, only positive case)
    // TODO: Rename a track
    // TODO: Change the symbol of a track
    // TODO: Add a new track (and verify it)
    // TODO: Remove a track (confirm and verify it)
  });

  test.fixme(
    'should not allow participants to configure the session grid',
    () => {
      // TODO: Invite bob
      // TODO: Bob checks that the button is missing (a bit difficult, wait till everything is loaded before checking!)
    }
  );
});
