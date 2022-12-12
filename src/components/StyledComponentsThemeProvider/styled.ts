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

import * as styledComponents from 'styled-components';

export type Theme = {
  type: 'light' | 'dark';
  primaryColor: string;
  pageBackground: string;
  pageBackgroundModal: string;
  borderColor: string;
  stickyNoteColor: string;
  secondaryText: string;
  errorColor: string;
};

const {
  default: styled,
  useTheme,
  css,
  createGlobalStyle,
  keyframes,
  ThemeProvider,
} = styledComponents as unknown as styledComponents.ThemedStyledComponentsModule<Theme>;

export { css, createGlobalStyle, keyframes, ThemeProvider, styled, useTheme };
