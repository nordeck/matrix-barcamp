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

test.describe('Accessibility', () => {
  test.beforeEach(({ page: _ }, testInfo) => {
    // Disable platform and browser specific snapshots suffixed. The results are
    // independent from the platform.
    testInfo.snapshotSuffix = '';
  });

  // TODO: Currently skipped as it still has accessibility issues
  test.fixme(
    'setup barcamp screen should not have automatically detectable accessibility violations',
    async ({ alicePage, aliceSessionGridWidgetPage, runAxeAnalysis }) => {
      await aliceSessionGridWidgetPage.setupBarCampButton.waitFor();

      expect(await runAxeAnalysis(alicePage, 'BarCamp')).toMatchSnapshot();
    }
  );

  // TODO: Currently skipped as it still has accessibility issues
  test.fixme(
    'empty session grid should not have automatically detectable accessibility violations',
    async ({ alicePage, aliceSessionGridWidgetPage, runAxeAnalysis }) => {
      await aliceSessionGridWidgetPage.setupBarCamp();

      expect(await runAxeAnalysis(alicePage, 'BarCamp')).toMatchSnapshot();
    }
  );

  test.fixme(
    'session grid edit mode should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Switch to edit mode
      // TODO: Check accessibility
    }
  );

  test.fixme(
    'filled session grid should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Add topics to both session grid, parking lot and queue
      // TODO: Check accessibility
    }
  );

  test.fixme(
    'topic view should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Add topic to parking lot
      // TODO: Open topic edit dialog
      // TODO: Check accessibility
    }
  );

  test.fixme(
    'empty personal space should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Go to personal space
      // TODO: Check accessibility
    }
  );

  test.fixme(
    'filled personal space should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Go to personal space
      // TODO: Submit a topic
      // TODO: Create another topic, but don't submit it
      // TODO: Check accessibility
    }
  );

  test.fixme(
    'assign room dialog should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Create an assignable room
      // TODO: Create a topic, place it on grid, open assign room dialog
      // TODO: Check accessibility
    }
  );

  test.fixme(
    'session view should not have automatically detectable accessibility violations',
    () => {
      // TODO: setup barcamp
      // TODO: Create an assignable room
      // TODO: Create a topic, place it on grid, assign room
      // TODO: Go to session room
      // TODO: Open session view widget
      // TODO: Check accessibility
    }
  );
});
