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
import { Input } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';
import { Tooltip } from '../Tooltip';

const Container = styled.div({
  display: 'flex',
  alignItems: 'baseline',
  flexDirection: 'column',
  marginLeft: -4,
});

const DateTimeInput = styled(Input)(({ theme }) => ({
  marginBottom: 8,

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

  '&&&&& > input': {
    colorScheme: theme.type === 'dark' ? 'dark' : undefined,
  },

  // workaround for firefox that doesn't shrink the input
  // field based on the "max" attribute by default
  '@-moz-document url-prefix()': {
    '&&&&& > input': {
      width: '12em',
    },
    '&&&&&::after, &&&&&::before': {
      width: 'calc(12em - 1.5em)',
    },
  },

  '&&&&&::before, &&&&&::after': {
    pointerEvents: 'none',
    whiteSpace: 'pre-wrap',
    marginRight: '1.5em',
    color: 'inherit',

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
}));

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
    <Container>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <DateTimeInput
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
        />
        {/* Required to make submit on enter to work in every env */}
        <input type="submit" hidden />
      </form>
    </Container>
  );
}
