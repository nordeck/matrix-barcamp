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
import { TextField, Box, Typography } from '@mui/material';

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

  const errorMessage = text.length === 0 ? lengthZeroText : (maxLength && text.length > maxLength) ? lengthExceededText : '';

  return (
    <Box className={className} sx={{ position: 'relative' }}>
      <TextField
        inputRef={ref}
        label={label}
        placeholder={placeholder}
        value={text}
        error={!!isError}
        helperText={errorMessage}
        fullWidth
        variant="outlined"
        size="small"
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
        InputProps={{
          endAdornment: maxLength && (
            <Typography
              variant="caption"
              sx={{
                color: isError ? 'error.main' : 'text.secondary',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {text.length} / {maxLength}
            </Typography>
          ),
        }}
      />
    </Box>
  );
}
