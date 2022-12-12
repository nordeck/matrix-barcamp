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
import { Input } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';

const Container = styled.div({
  display: 'flex',
  alignItems: 'baseline',
  flexDirection: 'column',
  marginLeft: -4,
});

const DurationInput = styled(Input)({
  '&&&&&': {
    display: 'inline-grid',

    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'transparent',
  },

  '&&&&& > input, &&&&&::after, &&&&&::before': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'transparent',
    padding: 4,

    gridArea: '1 / 1',
  },

  // workaround for firefox that doesn't shrink the input
  // field based on the "max" attribute by default
  '@-moz-document url-prefix()': {
    '&&&&& > input': {
      width: '6.5em',
    },
    '&&&&&::after, &&&&&::before': {
      width: 'calc(6.5em - 1.5em)',
    },
  },

  '&&&&&::before, &&&&&::after': {
    pointerEvents: 'none',
    whiteSpace: 'pre-wrap',
    marginRight: '1.5em',

    border: '1px solid transparent',
  },

  // This adds a hidden text node with the same styling and content to
  // automatically sizes the text input to its contents.
  '&&&&&::before': {
    content: "attr(data-value) '\u00a0' attr(data-suffix)",
    visibility: 'hidden',
  },

  // This adds a text node with the label that is displayed in the
  // input field.
  '&&&&&::after': {
    content: 'attr(data-suffix)',
    textAlign: 'right',
  },
});

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
    <Container>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          onSubmit();
        }}
        noValidate
      >
        <DurationInput
          data-value={isNaN(value) ? '' : value}
          data-suffix={t('sessionGrid.timeSlot.durationInputSuffix', 'min.')}
        >
          <input
            aria-label={t(
              'sessionGrid.timeSlot.durationInputLabel',
              'Track duration in minutes'
            )}
            type="number"
            min="0"
            max="1440"
            step="5"
            onBlur={onSubmit}
            value={value.toString()}
            onChange={(event) => setValue(event.target.valueAsNumber)}
          />
        </DurationInput>

        {/* Required to make submit on enter to work in every env */}
        <input type="submit" hidden />
      </form>
    </Container>
  );
}
