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

test.describe('Topic Scheduling', () => {
  test.beforeEach(async ({ aliceSessionGridWidgetPage }) => {
    await aliceSessionGridWidgetPage.setupBarCamp();

    // TODO: Invite bob

    // TODO: Fill the queue with some example topics
  });

  test.fixme('should allow moderators to draw topics from the queue', () => {
    // TODO: Moderator fills the parking log from the queue
  });

  test.fixme(
    'should not allow participants to draw topics from the queue',
    () => {
      // TODO: A participant can see the queue but not draw from it
    }
  );

  test.fixme(
    'should provide participants a read-only mode of topics on the session grid',
    () => {
      // TODO: Moderator draws a topic and places it on the grid
      // TODO: a second user can view the topic on the grid and in the dialog
    }
  );

  test.fixme(
    'should allow the moderator to draws topics from the queue and edit them',
    () => {
      // TODO: The moderator draws a topic into the parking lot
      // TODO: The moderator can edit the topic title and description
    }
  );

  test.fixme(
    'should allow the moderator to draws topics from the queue and delete them',
    () => {
      // TODO: The moderator draws a topic into the parking lot
      // TODO: The moderator can delete it
    }
  );

  test.fixme(
    'should allow the moderator to draws topics from the queue and places them on the session grid',
    () => {
      // TODO: The moderator draws a topic into the parking lot
      // TODO:The moderator moves the topic into the grid
      // TODO: The moderator can move another topic into the grid
      // TODO: The moderator can move the topic into another time slot on the grid
      // TODO: The moderator can move a topic back into the parking lot
      // TODO: Verify that changes to the grid are synced to the participants at the end
    }
  );

  test.fixme(
    'should allow the moderator to pin a topic on the session grid',
    () => {
      // TODO: The moderator draws a topic into the parking lot
      // TODO: The moderator moves the topic into the grid
      // TODO: The moderator can pin a topic
      // TODO: Verify that changes to the grid are synced to the participants at the end
      // TODO: The moderator can unpin a topic
    }
  );

  test.fixme('should allow the moderator to assign a room', () => {
    // TODO: The moderator draws a topic places it on the grid
    // TODO: The moderator creates a room and assigns it
    // TODO: The moderator can jump into the room via the session grid
  });
});
