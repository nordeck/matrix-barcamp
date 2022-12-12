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

import { useEffect, useRef, useState } from 'react';
import { Form } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';

const StyledFormField = styled(Form.Field)<{ 'data-error': boolean }>(
  ({ 'data-error': error, theme }) => ({
    '&&&&&': {
      display: 'inline-grid',
      width: '100%',
      position: 'relative',
    },

    '&&&&&& textarea': {
      resize: 'none',
    },

    '&&&&&&& > textarea, &&&&&::after, &&&&&::before': {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      fontFamily: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit',
      background: 'transparent',
      padding: 4,

      borderColor: error ? theme.errorColor : undefined,

      gridArea: '1 / 1',
    },

    // This adds a hidden text node with the same styling and content to
    // automatically sizes the text input to its contents.
    '&&&&&::before': {
      content: "attr(data-value) ' ' attr(data-suffix)",
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      border: '1px solid transparent',
      paddingRight: 8,
    },

    // This adds the `xx / xx` text at the bottom right corner.
    '&&&&&&::after': {
      content: 'attr(data-suffix)',
      pointerEvents: 'none',
      whiteSpace: 'pre-wrap',
      color: error ? theme.errorColor : '#434343',
      fontSize: '.9rem',
      fontWeight: 'bold',
      position: 'absolute',
      bottom: 0,
      right: 4,
    },
  })
);

export function TextArea({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  className,
  rows,
  maxLength,
  lengthZeroText,
  lengthExceededText = '',
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  className?: string;
  rows?: number;
  maxLength?: number;
  lengthZeroText: string;
  lengthExceededText?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const isError = text.length === 0 || (maxLength && text.length > maxLength);

  useEffect(() => {
    if (text.length === 0) {
      ref.current?.setCustomValidity(lengthZeroText);
    } else if (maxLength && text.length > maxLength) {
      ref.current?.setCustomValidity(lengthExceededText);
    } else {
      ref.current?.setCustomValidity('');
    }

    if (document.activeElement === ref.current) {
      ref.current?.reportValidity();
    }
  }, [lengthExceededText, lengthZeroText, maxLength, text]);

  return (
    <div className={`field ${className ?? ''}`}>
      <StyledFormField
        data-error={isError}
        data-suffix={`${text.length} / ${maxLength}`}
        data-value={text}
      >
        <textarea
          ref={ref}
          aria-label={label}
          placeholder={placeholder}
          rows={rows}
          value={text}
          onFocus={() => {
            ref.current?.reportValidity();
          }}
          onChange={(e) => {
            setText(e.target.value);
            onChange?.(e.target.value);
          }}
          onBlur={() => {
            if (text.length === 0) {
              setText(value);
              onChange?.(value);
            } else if (!isError) {
              onBlur?.(text);
            }
          }}
        />
      </StyledFormField>
    </div>
  );
}
