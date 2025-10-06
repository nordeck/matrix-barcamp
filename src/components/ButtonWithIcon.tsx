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

import { Button, styled } from '@mui/material';
import React from 'react';

export function withRefFix<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithRefFix({ ref, ...props }: P) {
    // This actually doesn't really add any feature, but makes semantic-ui happy
    // See https://github.com/Semantic-Org/Semantic-UI-React/issues/3786
    // Keyword: node.contains is not a function
    return <Component {...(props as P)} />;
  };
}

const StyledButton = styled(Button)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const ButtonWithIcon = withRefFix(StyledButton);
