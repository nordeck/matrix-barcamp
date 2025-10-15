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

import { WidgetApiImpl } from '@matrix-widget-toolkit/api';
import log from 'loglevel';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppWrapper } from './App';
import { getNonce } from './components/utils';
import './i18n';
import './index.css';
import { getEnvironment } from './lib/environment';
import { configureFontAwesome } from './lib/fontAwesomeConfig';
import { capabilities } from './lib/registration';

declare global {
  let __webpack_nonce__: string | undefined;

  interface Window {
    __webpack_nonce__: string | undefined;
  }
}

// Initialize webpack nonce to make sure that all style tags created by webpack
// include a nonce that suites our CSP.
__webpack_nonce__ = getNonce();

// Initialize nonce on window to make sure that styled-components creates style
// tags including our nonce.
window.__webpack_nonce__ = getNonce();

// Configure Font Awesome to use nonce for CSP compliance
configureFontAwesome();

log.setDefaultLevel(process.env.NODE_ENV === 'development' ? 'debug' : 'info');

const version = getEnvironment('REACT_APP_VERSION');
if (version) {
  log.info(
    `You are running version "${version}" of the matrix-barcamp-widget!`
  );
}

const widgetApiPromise = WidgetApiImpl.create({
  capabilities,
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

const app = <AppWrapper widgetApiPromise={widgetApiPromise} />;

root.render(app);
