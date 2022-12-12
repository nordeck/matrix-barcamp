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

import { StateEvent } from '@matrix-widget-toolkit/api';
import Joi from 'joi';
import { isValidEvent } from './validation';

export const STATE_EVENT_WIDGETS_LAYOUT = 'io.element.widgets.layout';

export type WidgetContainer = 'top' | 'right' | 'center';

export type StoredLayout = {
  container: WidgetContainer;
  index?: number;
  width?: number;
  height?: number;
};

// Based on https://github.com/matrix-org/matrix-react-sdk/blob/develop/src/stores/widgets/WidgetLayoutStore.ts#L33-L73
export type WidgetsLayoutEvent = {
  widgets: Record<string, StoredLayout>;
};

const storedLayoutSchema = Joi.object<StoredLayout, true>({
  container: Joi.string().valid('top', 'right', 'center').required(),
  index: Joi.number().strict(),
  width: Joi.number().strict(),
  height: Joi.number().strict(),
}).unknown();

const widgetsLayoutEventSchema = Joi.object<WidgetsLayoutEvent, true>({
  widgets: Joi.object().pattern(Joi.string(), storedLayoutSchema).required(),
}).unknown();

export function isValidWidgetsLayoutEvent(
  event: StateEvent<unknown>
): event is StateEvent<WidgetsLayoutEvent> {
  return isValidEvent(
    event,
    STATE_EVENT_WIDGETS_LAYOUT,
    widgetsLayoutEventSchema
  );
}
