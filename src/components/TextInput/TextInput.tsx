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
import { Input } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';

const StyledInput = styled(Input)<{ 'data-error': boolean }>(
  ({ 'data-error': error, theme }) => ({
    '&&&&&': {
      position: 'relative',
      display: 'inline-grid',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      fontStyle: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit',
      background: 'transparent',
    },

    '&&&&&& input': {
      fontSize: 'inherit',
      fontWeight: 'inherit',
      fontFamily: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit',
      background: 'transparent',
      gridArea: '1 / 1',
      paddingRight: '4rem',

      flex: '1',

      '&:invalid': {
        borderColor: theme.errorColor,
      },
    },

    // This adds the `xx / xx` text at the right corner.
    '&::after': {
      content: 'attr(data-suffix)',
      textAlign: 'right',
      pointerEvents: 'none',
      whiteSpace: 'pre-wrap',
      color: error ? theme.errorColor : '#434343',
      gridArea: '1 / 1',
      fontSize: '.9rem',
      alignSelf: 'center',
      fontWeight: 'bold',
      position: 'absolute',
      right: 4,
      marginRight: 4,
    },
  })
);

export function TextInput({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  className,
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
  maxLength?: number;
  lengthZeroText: string;
  lengthExceededText?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
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
    <StyledInput
      data-error={isError}
      data-suffix={`${text.length} / ${maxLength}`}
      className={className}
    >
      <input
        ref={ref}
        aria-label={label}
        placeholder={placeholder}
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
    </StyledInput>
  );
}
