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

import { config } from '@fortawesome/fontawesome-svg-core';
// Import Font Awesome CSS to ensure styles are available
// This will be processed by Vite and bundled with the correct nonce
import '@fortawesome/fontawesome-svg-core/styles.css';

/**
 * Configure Font Awesome to work with CSP nonce.
 * This must be called before any Font Awesome icons are rendered.
 *
 * ## CSP Compliance Strategy
 *
 * Font Awesome v7 by default attempts to inject CSS styles dynamically into the DOM
 * without a nonce attribute. This violates the Content Security Policy (CSP) rules
 * enforced by the widget-server.
 *
 * To solve this:
 * 1. We import the Font Awesome CSS file directly (above), which gets bundled by Vite
 *    into the main CSS bundle
 * 2. We disable Font Awesome's automatic CSS injection (config.autoAddCss = false)
 * 3. The widget-server automatically adds the nonce attribute to all <link> and <style>
 *    tags when serving the HTML, ensuring CSP compliance
 *
 * This approach ensures that all Font Awesome icons render correctly in production
 * while maintaining strict CSP compliance.
 */
export function configureFontAwesome(): void {
  // Disable Font Awesome's automatic CSS insertion since we're importing
  // the CSS file directly. This prevents Font Awesome from trying to inject
  // styles without a nonce, which would violate CSP.
  config.autoAddCss = false;
}
