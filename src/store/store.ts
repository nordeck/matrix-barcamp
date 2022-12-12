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

import { WidgetApi } from '@matrix-widget-toolkit/api';
import {
  Action,
  configureStore,
  isRejected,
  Middleware,
} from '@reduxjs/toolkit';
import { UnknownAsyncThunkRejectedAction } from '@reduxjs/toolkit/dist/matchers';
import log from 'loglevel';
import { baseApi } from './api/baseApi';

export function createStore({
  widgetApi,
  onError,
}: {
  widgetApi: WidgetApi;
  onError?: (action: UnknownAsyncThunkRejectedAction) => void;
}) {
  const roomId = widgetApi.widgetParameters.roomId;
  const userId = widgetApi.widgetParameters.userId;

  if (!roomId || !userId) {
    throw new Error('roomId or userId empty');
  }

  const errorsMiddleware: Middleware = () => (next) => (action: Action) => {
    if (isRejected(action) && action.error.name !== 'ConditionError') {
      onError?.(action);
      log.error('Error on redux action', action);
    }

    return next(action);
  };

  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: {
            widgetApi,
          } as ThunkExtraArgument,
        },
      })
        .concat(errorsMiddleware)
        .concat(baseApi.middleware),
  });

  return store;
}

/**
 * Extra arguments that are provided to `createAsyncThunk`
 */
export type ThunkExtraArgument = {
  widgetApi: WidgetApi;
};
