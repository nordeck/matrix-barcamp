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

import { type AnyAction, isRejectedWithValue } from '@reduxjs/toolkit';
import { type FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { t } from 'i18next';

/**
 * Type guard to check if an action is an RTK Query rejected action
 */
function isRTKQueryRejectedAction(action: AnyAction): action is AnyAction & {
  meta: {
    arg: {
      type: 'query' | 'mutation';
      endpointName: string;
    };
  };
  error: {
    message: string;
    name?: string;
  };
} {
  return (
    action.type.endsWith('/rejected') &&
    action.meta?.arg?.type !== undefined &&
    ['query', 'mutation'].includes(action.meta.arg.type)
  );
}

/**
 * Extracts the action type from an RTK Query action
 */
export function getActionType(
  action: AnyAction
): 'query' | 'mutation' | undefined {
  if (isRTKQueryRejectedAction(action)) {
    return action.meta.arg.type;
  }
  return undefined;
}

/**
 * Checks if the error is a fetch-related error
 */
function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

/**
 * Generates a user-friendly error message from a rejected action
 */
export function generateError(action: AnyAction): string {
  // Check if it's an RTK Query action with rejectWithValue
  if (isRejectedWithValue(action) && isRTKQueryRejectedAction(action)) {
    const { type, endpointName } = action.meta.arg;

    // Handle specific error types
    if (isFetchBaseQueryError(action.payload)) {
      const status = action.payload.status;
      if (status === 'FETCH_ERROR') {
        return t('errors.networkError', 'Network error occurred. Please check your connection.');
      }
      if (typeof status === 'number' && status >= 500) {
        return t('errors.serverError', 'Server error occurred. Please try again later.');
      }
    }

    // Generate error based on operation type
    if (type === 'query') {
      return t(
        'errors.queryFailed',
        'Error: Data could not be loaded.',
        { endpoint: endpointName }
      );
    }

    return t(
      'errors.mutationFailed',
      'Error: Data could not be updated.',
      { endpoint: endpointName }
    );
  }

  // Handle regular async thunk rejections
  if (isRTKQueryRejectedAction(action)) {
    const queryType = action.meta.arg.type;

    if (queryType === 'query') {
      return t('errors.queryFailed', 'Error: Data could not be loaded.');
    }

    return t('errors.mutationFailed', 'Error: Data could not be updated.');
  }

  // Fallback for unknown action types
  return t('errors.unknownError', 'An unexpected error occurred.');
}
