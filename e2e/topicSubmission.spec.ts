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

import { expect } from '@playwright/test';
import { test } from './fixtures';

test.describe('Topic Submission', () => {
  test.beforeEach(
    async ({ aliceSessionGridWidgetPage, aliceElementWebPage, bob }) => {
      await aliceElementWebPage.inviteUserToSpace(
        'Drinks BarCamp',
        bob.username
      );
      await aliceSessionGridWidgetPage.setupBarCamp();
      await aliceSessionGridWidgetPage.parkingLotRegion.waitFor();
    }
  );

  test('should allow participants to prepare a topic suggestion in the personal area, even though submission is closed', async ({
    aliceSessionGridWidgetPage,
    bobElementWebPage,
    bobSessionGridWidgetPage,
    browserName,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      browserName === 'webkit',
      "Hovering over semantic-ui tooltips using playwright doesn't work, therefore we skip the test for now. Hopefully this will work better with Mui."
    );
    // Tests with multiple users need a longer timeout
    test.slow();

    await expect(aliceSessionGridWidgetPage.openSubmissionButton).toBeVisible();

    // Let bob join the BarCamp
    await bobElementWebPage.switchToSpace('Drinks BarCamp');
    await bobElementWebPage.acceptSpaceInvitation();
    await bobElementWebPage.switchToRoom('Lobby');
    await bobElementWebPage.joinRoom();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();

    // Create a topic
    const personalSpace = await bobSessionGridWidgetPage.openPersonalSpace();
    await expect(personalSpace.dialog).toContainText('Submission closed');
    await personalSpace.createTopic();
    const topic = personalSpace.getTopic(0);
    await topic.titleTextbox.waitFor();
    await topic.titleTextbox.fill('Beer or cocktails?');
    await topic.descriptionTextbox.fill('I prefer beer…?');
    await expect(topic.submitButton).toBeDisabled();

    // Allow submission
    await aliceSessionGridWidgetPage.openSubmission();
    await expect(topic.submitButton).toBeEnabled();
    await topic.submit();

    // Check that topic is still displayed
    await expect(topic.card).toContainText('Beer or cocktails?');
    await expect(topic.card).toContainText('I prefer beer…?');
    await expect(topic.submitButton).toBeDisabled();

    // Check submission queue
    await expect(aliceSessionGridWidgetPage.topicQueueSection).toContainText(
      'Suggestion from Bob'
    );
    const topicQueue = await aliceSessionGridWidgetPage.getTopicQueue();
    expect(topicQueue[0]).toMatch(/Beer or cocktails\?/);
  });

  test('should order submissions by multiple users in a first-comes-first-served order', async ({
    aliceSessionGridWidgetPage,
    bobElementWebPage,
    bobSessionGridWidgetPage,
    browserName,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      browserName === 'webkit',
      "Hovering over semantic-ui tooltips using playwright doesn't work, therefore we skip the test for now. Hopefully this will work better with Mui."
    );
    // Tests with multiple users need a longer timeout
    test.slow();

    await aliceSessionGridWidgetPage.openSubmission();

    // Let bob join the BarCamp
    await bobElementWebPage.switchToSpace('Drinks BarCamp');
    await bobElementWebPage.acceptSpaceInvitation();
    await bobElementWebPage.switchToRoom('Lobby');
    await bobElementWebPage.joinRoom();
    await bobElementWebPage.approveWidgetWarning();
    await bobElementWebPage.approveWidgetCapabilities();

    // Create a first topic by Bob
    const bobPersonalSpace = await bobSessionGridWidgetPage.openPersonalSpace();
    await bobPersonalSpace.createTopic();
    const bobTopic0 = bobPersonalSpace.getTopic(0);
    await bobTopic0.titleTextbox.waitFor();
    await bobTopic0.titleTextbox.fill('Beer or cocktails?');
    await bobTopic0.descriptionTextbox.fill('I prefer beer…?');
    await bobTopic0.submit();

    // Create a topic by Alice
    const alicePersonalSpace =
      await aliceSessionGridWidgetPage.openPersonalSpace();
    await alicePersonalSpace.createTopic();
    const aliceTopic = alicePersonalSpace.getTopic(0);
    await aliceTopic.titleTextbox.waitFor();
    await aliceTopic.titleTextbox.fill('Gin or rum?');
    await aliceTopic.descriptionTextbox.fill('What do you prefer?');
    await aliceTopic.submit();
    await alicePersonalSpace.closeDialog();

    // Create a second topic by Bob
    await bobPersonalSpace.createTopic();
    const bobTopic1 = bobPersonalSpace.getTopic(1);
    await bobTopic1.titleTextbox.waitFor();
    await bobTopic1.titleTextbox.fill('Snacks for drinks');
    await bobTopic1.descriptionTextbox.fill(
      'Which snacks should be available?'
    );
    await bobTopic1.submit();

    // Check submission queue
    await expect(aliceSessionGridWidgetPage.topicQueueSection).toContainText(
      'Suggestions from Bob and 2 more'
    );
    const topicQueue = await aliceSessionGridWidgetPage.getTopicQueue();
    expect(topicQueue[0]).toMatch(/Beer or cocktails\?/);
    expect(topicQueue[1]).toMatch(/Gin or rum\?/);
    expect(topicQueue[2]).toMatch(/Snacks for drinks/);
  });

  test('should allow editing and deleting topic drafts', async ({
    aliceSessionGridWidgetPage,
  }) => {
    const personalSpace = await aliceSessionGridWidgetPage.openPersonalSpace();
    await personalSpace.createTopic();
    const topic0 = personalSpace.getTopic(0);
    await topic0.titleTextbox.waitFor();
    await topic0.titleTextbox.fill('Gin or rum?');
    await topic0.descriptionTextbox.fill('What do you prefer?');

    await personalSpace.createTopic();
    const topic1 = personalSpace.getTopic(1);
    await topic1.titleTextbox.waitFor();
    await topic1.titleTextbox.fill('Snacks for drinks');
    await topic1.descriptionTextbox.fill('Which snacks should be available?');
    await expect(personalSpace.cards).toHaveCount(2);

    // Edit a topic
    await topic0.titleTextbox.fill('Wodka or rum?');

    // Delete a topic
    await topic1.delete();
    await expect(personalSpace.cards).toHaveCount(1);
  });

  test('should allow to save submission drafts', async ({
    aliceElementWebPage,
    aliceSessionGridWidgetPage,
  }) => {
    // Create topic
    let personalSpace = await aliceSessionGridWidgetPage.openPersonalSpace();
    await personalSpace.createTopic();
    const topicDraft = personalSpace.getTopic(0);
    await topicDraft.titleTextbox.waitFor();
    await topicDraft.titleTextbox.fill('Gin or rum?');
    await topicDraft.descriptionTextbox.fill('What do you prefer?');

    // Check that the topic is still there after leaving the widget
    await aliceElementWebPage.switchToSpaceHome('Drinks BarCamp');
    await aliceElementWebPage.switchToRoom('Lobby');

    // Open personal space again
    personalSpace = await aliceSessionGridWidgetPage.openPersonalSpace();
    const topicRestored = personalSpace.getTopic(0);
    await expect(topicRestored.titleTextbox).toHaveValue('Gin or rum?');
    await expect(topicRestored.descriptionTextbox).toHaveValue(
      'What do you prefer?'
    );
  });

  test('should allow moderators to always submit topics, even though submission is closed', async ({
    aliceSessionGridWidgetPage,
    browserName,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      browserName === 'webkit',
      "Hovering over semantic-ui tooltips using playwright doesn't work, therefore we skip the test for now. Hopefully this will work better with Mui."
    );

    await expect(aliceSessionGridWidgetPage.openSubmissionButton).toBeVisible();

    // Create topic
    const personalSpace = await aliceSessionGridWidgetPage.openPersonalSpace();
    await personalSpace.createTopic();
    const topic = personalSpace.getTopic(0);
    await topic.titleTextbox.waitFor();
    await topic.titleTextbox.fill('Gin or rum?');
    await topic.descriptionTextbox.fill('What do you prefer?');
    await topic.submit();
    await personalSpace.closeDialog();

    // Check submission queue
    await expect(aliceSessionGridWidgetPage.topicQueueSection).toContainText(
      'Suggestion from Alice'
    );
    const topicQueue = await aliceSessionGridWidgetPage.getTopicQueue();
    expect(topicQueue[0]).toMatch(/Gin or rum\?/);
  });
});
