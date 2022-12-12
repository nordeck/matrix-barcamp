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
import { SessionGridWidgetPage } from './pages';

test.describe('BarCamp Widget Setup', () => {
  test('should show setup instructions if opened outside of element', async ({
    page,
    baseURL,
  }) => {
    await page.goto(baseURL!);

    await expect(page.getByText(/Only runs as a widget/)).toBeVisible();
    await expect(page.getByText(/\/addwidget/)).toBeVisible();
  });

  test('should show a warning if barcamp widget is installed into a non space room', async ({
    aliceElementWebPage,
    baseURL,
  }) => {
    await aliceElementWebPage.createRoom('Non-Space-Room');
    await aliceElementWebPage.setupWidget(baseURL!);

    const widget = aliceElementWebPage.widgetByTitle('BarCamp');

    await expect(
      widget.getByText(/Your Matrix room is not part of a Matrix space/)
    ).toBeVisible();
  });

  test('should install barcamp widget into a space room', async ({
    alicePage,
    aliceElementWebPage,
    aliceJitsiWidgetPage,
    baseURL,
  }) => {
    await aliceElementWebPage.createSpace('Drinks BarCamp');

    await aliceElementWebPage.createRoom('Lobby');
    await aliceElementWebPage.setupWidget(baseURL!);

    const widget = new SessionGridWidgetPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('BarCamp')
    );

    await widget.setupBarCamp();

    await expect(widget.parkingLotRegion).toBeVisible();
    await expect(aliceJitsiWidgetPage.joinConferenceButton).toBeVisible();

    await aliceElementWebPage.switchToSpaceHome('Drinks BarCamp');
    await expect(
      aliceElementWebPage.spaceHomeRoomTree.getByRole('treeitem', {
        name: /Lobby/,
      })
    ).toContainText('Suggested');
  });
});
