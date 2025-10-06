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

import { DateTime } from 'luxon';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, Box } from '@mui/material';
import { Tooltip } from '../Tooltip';

type InlineDateTimeEditProps = {
  value: string;
  label: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
};

export function InlineDateTimeEdit({
  value,
  label,
  onChange,
  readOnly = false,
}: InlineDateTimeEditProps) {
  const { t } = useTranslation();

  const [input, setInput] = useState(value);
  useEffect(() => {
    setInput(value);
  }, [value, readOnly]);

  const onSubmit = useCallback(() => {
    if (input !== null) {
      onChange(input);
    } else {
      setInput(value);
    }
  }, [onChange, value, input]);

  if (readOnly) {
    return (
      <Tooltip
        content={t(
          'sessionGrid.timeSlot.dateTimeInputTooltip',
          '{{ startTime, datetime }}',
          {
            startTime: new Date(input),
            formatParams: {
              startTime: {
                hour: 'numeric',
                minute: 'numeric',
                month: 'long',
                year: 'numeric',
                day: 'numeric',
                weekday: 'long',
              },
            },
          }
        )}
      >
        <span>
          {t('sessionGrid.timeSlot.startTime', '{{startTime, datetime}}', {
            startTime: DateTime.fromISO(input).toJSDate(),
            formatParams: {
              startTime: { hour: 'numeric', minute: 'numeric' },
            },
          })}
        </span>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', flexDirection: 'column', ml: -0.5 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <TextField
          type="datetime-local"
          name="meeting-date-time"
          value={DateTime.fromISO(input).toLocal().toISO({
            suppressMilliseconds: true,
            suppressSeconds: true,
            includeOffset: false,
          })}
          onBlur={onSubmit}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value;
            const isoDate = DateTime.fromISO(input).toISO({
              suppressMilliseconds: true,
            });
            setInput(isoDate);
          }}
          aria-label={label}
          size="small"
          variant="outlined"
          sx={{ mb: 1 }}
          InputLabelProps={{
            shrink: true,
          }}
        />
        {/* Required to make submit on enter to work in every env */}
        <input type="submit" hidden />
      </form>
    </Box>
  );
}
