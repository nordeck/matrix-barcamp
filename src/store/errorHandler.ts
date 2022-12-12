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

import { UnknownAsyncThunkRejectedAction } from '@reduxjs/toolkit/dist/matchers';
import {
  MutationThunk,
  QueryThunk,
  RejectedAction,
} from '@reduxjs/toolkit/dist/query/core/buildThunks';
import { t } from 'i18next';

export function getActionType(
  action: unknown
): 'query' | 'mutation' | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = action as RejectedAction<QueryThunk | MutationThunk, any>;

  return a?.meta?.arg?.type;
}

export function generateError(action: UnknownAsyncThunkRejectedAction): string {
  const queryType = getActionType(action);

  if (queryType === 'query') {
    return t('errors.queryFailed', 'Error: Data could not be loaded.');
  }

  return t('errors.mutationFailed', 'Error: Data could not be updated.');
}
