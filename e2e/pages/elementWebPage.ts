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

import { expect, FrameLocator, Locator, Page } from '@playwright/test';
import fetch from 'cross-fetch';
import { Credentials, getElementWebUrl, getSynapseUrl } from '../util';

export class ElementWebPage {
  private readonly sidebarRegion: Locator;
  private readonly navigationRegion: Locator;
  private readonly headerRegion: Locator;
  public readonly spaceHomeRoomTree: Locator;

  constructor(private readonly page: Page) {
    this.navigationRegion = page.getByRole('navigation');
    this.sidebarRegion = page.getByRole('complementary');
    this.headerRegion = page.getByRole('main').locator('header');
    this.spaceHomeRoomTree = page
      .getByRole('main')
      .getByRole('tree', { name: 'Space' });
  }

  async approveWidgetWarning() {
    await this.page
      .getByText('Widget added by')
      .locator('..')
      .getByRole('button', { name: 'Continue' })
      .click();
  }

  async approveWidgetCapabilities() {
    await this.page
      .getByRole('dialog') // TODO: We can't use [name="Approve widget permissions"] here as Element is reusing the same dialog name if multiple dialogs are open at once.
      .getByRole('button', { name: 'Approve' })
      .click();
  }

  async reloadWidgets() {
    await this.headerRegion
      .getByRole('button', { name: 'Hide Widgets' })
      .click();
    await this.headerRegion
      .getByRole('button', { name: 'Show Widgets' })
      .click();
  }

  public getCurrentRoomId(): string {
    const m = this.page.url().match(/#\/room\/(.*)/);
    const roomId = m && m[1];

    if (!roomId) {
      throw new Error('Unknown room');
    }

    return roomId;
  }

  async createRoom(
    roomName: string,
    { encrypted = false }: { encrypted?: boolean } = {}
  ) {
    await this.navigationRegion
      .getByRole('button', { name: 'Add', exact: true })
      .click();
    await this.page
      .getByRole('menuitem', { name: 'New room', exact: true })
      .click();
    await this.page
      .getByRole('textbox', { name: 'Name', exact: true })
      .type(roomName);

    if (!encrypted) {
      await this.page
        .getByRole('switch', {
          name: 'Enable end-to-end encryption',
          checked: true,
        })
        .click();
    }

    await this.page.getByRole('button', { name: 'Create room' }).click();
  }

  async createSpace(spaceName: string) {
    await this.navigationRegion
      .getByRole('button', { name: 'Create a space' })
      .click();
    await this.page.getByRole('button', { name: /Private/ }).click();
    await this.page.getByRole('textbox', { name: 'Name' }).type(spaceName);
    await this.page
      .getByRole('button', { name: 'Create', exact: true })
      .click();
    await this.page
      .getByRole('button', { name: spaceName, exact: true })
      .click();
  }

  async switchToSpaceHome(spaceName: string) {
    await this.navigationRegion
      .getByRole('button', { name: `${spaceName} menu` })
      .click();
    await this.page.getByRole('menuitem', { name: 'Space home' }).click();
  }

  async switchToSpace(spaceName: string) {
    await this.navigationRegion
      .getByRole('tree', { name: 'Spaces' })
      .getByRole('treeitem', { name: spaceName })
      .click();
  }

  async acceptSpaceInvitation() {
    await this.page.getByRole('button', { name: 'Accept' }).click();
  }

  async switchToRoom(name: string) {
    await this.page
      .getByRole('tree', { name: 'Rooms' })
      .getByRole('treeitem', {
        name: new RegExp(`^${name}( Unread messages\\.)?`),
      })
      .click();
  }

  async joinRoom() {
    await this.page
      .getByRole('button', { name: 'Join the discussion' })
      .click();
  }

  async toggleRoomInfo() {
    await this.headerRegion.getByRole('tab', { name: 'Room Info' }).click();
  }

  async sendMessage(message: string) {
    // Both for encrypted and non-encrypted cases
    await this.page.getByRole('textbox', { name: /message…/ }).type(message);
    await this.page.getByRole('button', { name: 'Send message' }).click();
  }

  widgetByTitle(title: string): FrameLocator {
    return this.page.frameLocator(`iframe[title="${title}"]`);
  }

  async setupWidget(url: string) {
    await this.sendMessage(`/addwidget ${url}`);

    await this.toggleRoomInfo();
    await this.sidebarRegion
      .getByRole('button', { name: 'Custom' })
      .locator('..')
      .getByRole('button', { name: 'Pin' })
      .click();

    await this.approveWidgetCapabilities();

    await this.toggleRoomInfo();

    await this.widgetByTitle('Custom')
      .getByRole('button', { name: 'Repair registration' })
      .click();

    await this.approveWidgetCapabilities();

    await expect(
      // Title has changed, so we can't wait for the exact title!
      this.page
        .frameLocator('iframe[title]')
        .getByText('Widget configuration complete')
    ).toBeVisible();

    await this.reloadWidgets();
    await this.approveWidgetCapabilities();
  }

  async inviteUserToSpace(spaceName: string, username: string) {
    await this.navigationRegion
      .getByRole('button', { name: `${spaceName} menu` })
      .click();
    await this.page.getByRole('menuitem', { name: 'Invite' }).click();

    await this.inviteTo(username);
  }

  async inviteUserToRoom(username: string) {
    await this.navigationRegion
      .getByRole('button', { name: /Invite to/ })
      .first()
      .click();

    await this.inviteTo(username);
  }

  private async inviteTo(username: string) {
    const inviteDialog = this.page.getByRole('dialog', { name: /Invite to/ });

    await inviteDialog
      .getByRole('textbox', { name: '' })
      .fill(`@${username}:localhost`);
    await inviteDialog.getByRole('button', { name: 'Invite' }).click();
    await inviteDialog.waitFor({ state: 'hidden' });
  }

  async login(username: string, password: string): Promise<Credentials> {
    const synapseUrl = getSynapseUrl();
    const url = `${synapseUrl}/_matrix/client/r0/login`;
    const createResp = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        type: 'm.login.password',
        identifier: {
          type: 'm.id.user',
          user: username,
        },
        password,
      }),
    });
    const credentials = (await createResp.json()) as {
      access_token: string;
      user_id: string;
      device_id: string;
      home_server: string;
    };

    // To set the credentials, we have to be on the correct origin. But loading
    // element full is expensive, so we load something else.
    await this.page.goto(`${getElementWebUrl()}/welcome/images/logo.svg`);

    // Seed the localStorage with the required credentials
    await this.page.evaluate(
      ({ synapseUrl, credentials }) => {
        window.localStorage.setItem('mx_hs_url', synapseUrl);
        window.localStorage.setItem('mx_user_id', credentials.user_id);
        window.localStorage.setItem(
          'mx_access_token',
          credentials.access_token
        );
        window.localStorage.setItem('mx_device_id', credentials.device_id);
        window.localStorage.setItem('mx_is_guest', 'false');
        window.localStorage.setItem('mx_has_pickle_key', 'false');
        window.localStorage.setItem('mx_has_access_token', 'true');
        window.localStorage.setItem(
          'mx_local_settings',
          JSON.stringify({
            // Disable opt-ins and cookie headers
            analyticsOptIn: false,
            showCookieBar: false,
            // Set language to en instead of using the current locale
            language: 'en',
            // Always test in high contrast mode
            theme: 'light-high-contrast',
          })
        );
        // Don't ask the user if he wants to enable notifications
        window.localStorage.setItem('notifications_hidden', 'true');
        // Disable audio notifications, they can be annoying during tests
        window.localStorage.setItem('audio_notifications_enabled', 'false');
      },
      { synapseUrl, credentials }
    );

    // Reload and use the credentials
    await this.page.goto(getElementWebUrl());

    // Wait for Element to be ready
    await this.navigationRegion
      .getByRole('button', { name: 'Add', exact: true })
      .waitFor();

    return {
      accessToken: credentials.access_token,
      userId: credentials.user_id,
      deviceId: credentials.device_id,
      homeServer: credentials.home_server,
    };
  }
}
