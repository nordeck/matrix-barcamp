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

import { FrameLocator, Locator, Page } from '@playwright/test';

export class SessionGridWidgetPage {
  public readonly setupBarCampButton: Locator;
  public readonly parkingLotRegion: Locator;
  public readonly submitTopicButton: Locator;
  public readonly openSubmissionButton: Locator;
  public readonly selectNextTopicButton: Locator;
  public readonly topicQueueSection: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator
  ) {
    this.setupBarCampButton = widget.getByRole('button', {
      name: 'Setup BarCamp',
    });
    this.parkingLotRegion = widget.getByRole('region', { name: 'Parking Lot' });
    this.submitTopicButton = widget.getByRole('button', {
      name: 'Submit a topic',
    });
    this.openSubmissionButton = widget.getByRole('button', {
      name: 'Open topic submission for participants',
    });
    this.selectNextTopicButton = widget.getByRole('button', {
      name: 'Select next topic',
    });

    // TODO: This is an accessibility nightmare. Right now it is by no way
    // accessibile and therefore also hard to reach in tests
    this.topicQueueSection = widget
      .getByText('Parking Lot')
      .locator('..')
      .locator('> div')
      .nth(2);
  }

  async setupBarCamp() {
    await this.setupBarCampButton.click();
  }

  async openSubmission() {
    await this.openSubmissionButton.click();
  }

  async openPersonalSpace(): Promise<PersonalSpaceDialog> {
    await this.submitTopicButton.click();

    return new PersonalSpaceDialog(
      this.page,
      this.widget,
      this.widget.getByRole('dialog', { name: 'Personal Space' })
    );
  }

  async getTopicQueue(): Promise<string[]> {
    // TODO: This is by now way accessible to screen reader and therefore hard
    // to test
    await this.topicQueueSection.hover();

    const topics = this.widget.locator('ol:below(:text("Topic suggestions"))');
    await topics.waitFor();
    const topicQueue = await topics.getByRole('listitem').allTextContents();
    return topicQueue;
  }
}

export class PersonalSpaceDialog {
  public readonly cards: Locator;

  constructor(
    private readonly page: Page,
    private readonly widget: FrameLocator,
    public readonly dialog: Locator
  ) {
    // TODO: Individual topics are hard to access because they are not
    // accessible. Hopefully we can fix this in the Mui migration.
    this.cards = this.dialog
      .getByRole('button', { name: 'Create new topic' })
      .locator('..')
      .locator('>div');
  }

  async createTopic() {
    await this.dialog.getByRole('button', { name: 'Create new topic' }).click();
  }

  async closeDialog() {
    await this.dialog.getByRole('button', { name: 'Close' }).click();
  }

  getTopic(index: number): PersonalSpaceTopic {
    return new PersonalSpaceTopic(this.widget, this.cards.nth(index));
  }
}

export class PersonalSpaceTopic {
  public readonly titleTextbox: Locator;
  public readonly descriptionTextbox: Locator;
  public readonly submitButton: Locator;
  public readonly deleteButton: Locator;

  constructor(
    private readonly widget: FrameLocator,
    public readonly card: Locator
  ) {
    this.titleTextbox = card.getByRole('textbox', { name: 'Title' });
    this.descriptionTextbox = card.getByRole('textbox', {
      name: 'Description',
    });
    this.submitButton = card.getByRole('button', {
      name: /Submit|Already Submitted/,
    });
    this.deleteButton = card.getByRole('button', { name: 'Delete topic' });
  }

  async submit() {
    await this.submitButton.click();
  }

  async delete() {
    await this.deleteButton.click();
    await this.widget
      .getByRole('dialog', { name: 'Delete the topic suggestion?' })
      .getByRole('button', { name: 'Delete' })
      .click();
  }
}
