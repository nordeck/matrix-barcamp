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

test.describe('Session', () => {
  test.beforeEach(async ({ aliceSessionGridWidgetPage }) => {
    await aliceSessionGridWidgetPage.setupBarCamp();

    // TODO: Schedule a topic into the parking lot / session grid, assign a room
  });

  test.fixme(
    'should have a session widget and video conference in the room',
    () => {
      // TODO: jump into session from session grid
      // TODO: switch to room and verify content of session widget
      // TODO: verify jitsi widget
    }
  );

  test.fixme('should allow to jump back into the lobby room', () => {
    // TODO: jump into session room from session grid
    // TODO: Verify room (e.g. title), or that session widget is available
    // TODO: jump into lobby from session widget
    // TODO: Verify room (e.g. title), or that session grid is available
  });
});
