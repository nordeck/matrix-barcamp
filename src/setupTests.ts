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

// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { AxeResults } from 'axe-core';
import log from 'loglevel';
import { Settings } from 'luxon';
import { TextDecoder, TextEncoder } from 'util';
// Make sure to initialize i18n (see mock below)
import './i18n';

// Use a different configuration for i18next during tests
vi.mock('./i18n', async () => {
  const { default: i18n } = await vi.importActual<{ default: typeof import('i18next') }>('i18next');
  const { initReactI18next } = await vi.importActual<{ initReactI18next: typeof import('react-i18next')['initReactI18next'] }>('react-i18next');

  i18n.use(initReactI18next).init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: { en: {} },
  });

  return { default: i18n };
});

// Add support for axe
expect.extend({
  toHaveNoViolations(results: AxeResults) {
    const violations = results.violations ?? [];

    return {
      pass: violations.length === 0,
      actual: violations,
      message() {
        if (violations.length === 0) {
          return '';
        }

        return `Expected no accessibility violations but received some.

${violations
  .map(
    (violation) => `[${violation.impact}] ${violation.id}
${violation.description}
${violation.helpUrl}
`,
  )
  .join('\n')}
`;
      },
    };
  },
});

// store original instance
const DateTimeFormat = Intl.DateTimeFormat;
function mockDateTimeFormatTimeZone(timeZone: string): void {
  vi
    .spyOn(Intl, 'DateTimeFormat')
    .mockImplementation(
      (locale, options) => new DateTimeFormat(locale, { ...options, timeZone })
    );
}

beforeEach(() => {
  // We want our tests to be in a reproducible time zone, always resulting in
  // the same results, independent from where they are run.
  mockDateTimeFormatTimeZone('UTC');
});

// Disable log output in tests, to make sure that we the console is not
// overflowed with stuff we don't need.
log.setLevel('silent');

// We want our tests to be in a reproducible time zone, always resulting in
// the same results, independent from where they are run.
Settings.defaultZone = 'UTC';

// Polyfills required for jsdom
global.TextEncoder = TextEncoder as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
