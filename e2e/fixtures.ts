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

import AxeBuilder from '@axe-core/playwright';
import { Page, test as base, TestInfo, VideoMode } from '@playwright/test';
import {
  ElementWebPage,
  JitsiWidgetPage,
  SessionGridWidgetPage,
} from './pages';
import { registerUser, User } from './util';

type Fixtures = {
  alice: User;
  alicePage: Page;
  aliceElementWebPage: ElementWebPage;
  aliceSessionGridWidgetPage: SessionGridWidgetPage;
  aliceJitsiWidgetPage: JitsiWidgetPage;
  bob: User;
  bobPage: Page;
  bobElementWebPage: ElementWebPage;
  bobSessionGridWidgetPage: SessionGridWidgetPage;
  bobJitsiWidgetPage: JitsiWidgetPage;
  runAxeAnalysis: (page: Page, widgetTitle: string) => Promise<string>;
};

export function shouldCaptureVideo(
  videoMode: VideoMode | 'retry-with-video',
  testInfo: TestInfo
) {
  return (
    videoMode === 'on' ||
    videoMode === 'retain-on-failure' ||
    (videoMode === 'on-first-retry' && testInfo.retry === 1)
  );
}

export const test = base.extend<Fixtures>({
  alice: async ({ page: _ }, use) => {
    // Alice is the user that has the moderator role in the BarCamp.
    const user = await registerUser('Alice');

    await use(user);
  },

  alicePage: async ({ page }, use) => {
    // Just an alias for page
    await use(page);
  },

  aliceElementWebPage: async ({ alicePage, alice }, use) => {
    const elementWebPage = new ElementWebPage(alicePage);
    await elementWebPage.login(alice.username, alice.password);

    await use(elementWebPage);
  },

  aliceSessionGridWidgetPage: async (
    { alicePage, aliceElementWebPage, baseURL },
    use
  ) => {
    if (!baseURL) {
      throw new Error('No base url set');
    }

    await aliceElementWebPage.createSpace('Drinks BarCamp');

    await aliceElementWebPage.createRoom('Lobby');
    await aliceElementWebPage.setupWidget(baseURL);

    await aliceElementWebPage
      .widgetByTitle('BarCamp')
      .locator('body')
      .waitFor({ state: 'attached' });

    const sessionGridWidgetPage = new SessionGridWidgetPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('BarCamp')
    );

    await sessionGridWidgetPage.setupBarCampButton.waitFor({
      state: 'attached',
    });

    await use(sessionGridWidgetPage);
  },

  aliceJitsiWidgetPage: async ({ alicePage, aliceElementWebPage }, use) => {
    const jitsiWidgetPage = new JitsiWidgetPage(
      alicePage,
      aliceElementWebPage.widgetByTitle('Video Conference')
    );

    await use(jitsiWidgetPage);
  },

  bob: async ({ page: _ }, use) => {
    // Alice is the user that has the participant role in the BarCamp.
    const user = await registerUser('Bob');

    await use(user);
  },

  bobPage: async ({ browser, contextOptions, video }, use, testInfo) => {
    // TODO: For some reason we are missing the video in case we are using a
    // second context https://github.com/microsoft/playwright/issues/9002
    // We configure it manually instead.
    const videoMode = typeof video === 'string' ? video : video.mode;
    const videoOptions = shouldCaptureVideo(videoMode, testInfo)
      ? {
          recordVideo: {
            dir: testInfo.outputDir,
            size: typeof video !== 'string' ? video.size : undefined,
          },
        }
      : {};

    const context = await browser.newContext({
      ...contextOptions,
      ...videoOptions,
    });
    const page = await context.newPage();

    try {
      await use(page);
    } finally {
      await context.close();

      const video = page.video();

      if (video) {
        const path = testInfo.outputPath('video-bob.webm');
        await video.saveAs(path);
        testInfo.attach('video', { path, contentType: 'video/webm' });
      }
    }
  },

  bobElementWebPage: async ({ bobPage, bob }, use) => {
    const elementWebPage = new ElementWebPage(bobPage);
    await elementWebPage.login(bob.username, bob.password);

    await use(elementWebPage);
  },

  bobSessionGridWidgetPage: async ({ bobPage, bobElementWebPage }, use) => {
    const sessionGridWidgetPage = new SessionGridWidgetPage(
      bobPage,
      bobElementWebPage.widgetByTitle('BarCamp')
    );

    await use(sessionGridWidgetPage);
  },

  bobJitsiWidgetPage: async ({ bobPage, bobElementWebPage }, use) => {
    const jitsiWidgetPage = new JitsiWidgetPage(
      bobPage,
      bobElementWebPage.widgetByTitle('Video Conference')
    );

    await use(jitsiWidgetPage);
  },

  runAxeAnalysis: async ({ page: _ }, use, testInfo) => {
    const fn = async (page: Page, widgetTitle: string) => {
      type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;

      function violationFingerprints(accessibilityScanResults: AxeResults) {
        const violationFingerprints = accessibilityScanResults.violations.map(
          (violation) => ({
            rule: violation.id,
            description: violation.description,
            // These are CSS selectors which uniquely identify each element with
            // a violation of the rule in question.
            targets: violation.nodes.map((node) => ({
              target: node.target,
              failureSummary: node.failureSummary,
            })),
          })
        );

        return JSON.stringify(violationFingerprints, null, 2);
      }

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .include(`iframe[title="${widgetTitle}"]`)
        .analyze();

      await testInfo.attach('accessibility-scan-results', {
        body: JSON.stringify(accessibilityScanResults, null, 2),
        contentType: 'application/json',
      });

      return violationFingerprints(accessibilityScanResults);
    };

    await use(fn);
  },
});
