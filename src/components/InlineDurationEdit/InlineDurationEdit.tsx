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

import { clamp } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField, Box, InputAdornment } from '@mui/material';

type InlineDurationEditProps = {
  minutes: number;
  onChange: (minutes: number) => void;
  readOnly?: boolean;
};

export function InlineDurationEdit({
  minutes,
  onChange,
  readOnly = false,
}: InlineDurationEditProps) {
  const { t } = useTranslation();

  const [value, setValue] = useState(minutes);
  useEffect(() => {
    setValue(minutes);
  }, [minutes, readOnly]);

  const onSubmit = useCallback(() => {
    if (!isNaN(value)) {
      onChange(clamp(value, 0, 1440));
    } else {
      // reset the original value if empty or nan
      setValue(minutes);
    }
  }, [minutes, onChange, value]);

  if (readOnly) {
    return (
      <span>
        {t('sessionGrid.timeSlot.duration', '{{duration}} min.', {
          duration: minutes,
        })}
      </span>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', flexDirection: 'column', ml: -0.5 }}>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <TextField
          type="number"
          aria-label={t(
            'sessionGrid.timeSlot.durationInputLabel',
            'Track duration in minutes'
          )}
          inputProps={{
            min: 0,
            max: 1440,
            step: 5,
          }}
          onBlur={onSubmit}
          value={isNaN(value) ? '' : value}
          onChange={(event) => setValue(parseFloat(event.target.value) || 0)}
          size="small"
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {t('sessionGrid.timeSlot.durationInputSuffix', 'min.')}
              </InputAdornment>
            ),
          }}
        />
        {/* Required to make submit on enter to work in every env */}
        <input type="submit" hidden />
      </form>
    </Box>
  );
}
