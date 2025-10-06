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

import React, { PropsWithChildren } from 'react';
import { Tooltip as MuiTooltip } from '@mui/material';

export type TooltipProps = PropsWithChildren<{
  content?: React.ReactNode;
  placement?:
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-end'
    | 'bottom-start'
    | 'left'
    | 'top'
    | 'bottom'
    | undefined;
  suppress?: boolean;
}>;

export function Tooltip({
  content,
  placement = 'top',
  children,
  suppress,
}: TooltipProps) {
  if (suppress || !content) {
    return <>{children}</>;
  }

  return (
    <MuiTooltip 
      title={content} 
      placement={placement}
      enterDelay={500}
      leaveDelay={500}
      arrow
    >
      <span>{children}</span>
    </MuiTooltip>
  );
}
