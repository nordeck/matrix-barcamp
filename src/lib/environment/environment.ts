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

import log from 'loglevel';

declare global {
  interface Window {
    __ENVIRONMENT__: string | undefined;
  }
}

function getWindowEnvironment(): Record<string, string | undefined> {
  if (typeof window.__ENVIRONMENT__ === 'string') {
    const encoded = window.__ENVIRONMENT__;

    try {
      return JSON.parse(window.atob(encoded));
    } catch {
      log.warn('window.__ENVIRONMENT__ has an unexpected format', encoded);
    }
  }
  return {};
}

const environment = getWindowEnvironment();

/**
 * Read a config variable starting with `REACT_APP_` from the `window` object.
 * It falls back to `process.env` build time variables in the create-react-app
 * development server.
 *
 * @param name - the name of the variable (ex: `REACT_APP_EXAMPLE`).
 * @returns the config variable or `undefined`.
 */
export function getEnvironment(name: string): string | undefined;

/**
 * Read a config variable starting with `REACT_APP_` from the `window` object.
 * It falls back to `process.env` build time variables in the create-react-app
 * development server.
 *
 * @param name - the name of the variable (ex: `REACT_APP_EXAMPLE`).
 * @param defaultValue - the default value if the variable is unset.
 * @returns the config variable.
 */
export function getEnvironment(name: string, defaultValue: string): string;

export function getEnvironment(
  name: string,
  defaultValue?: string
): string | undefined {
  const value = environment[name] || process.env[name];
  return value ?? defaultValue;
}
