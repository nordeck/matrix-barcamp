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

import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { styled } from '../StyledComponentsThemeProvider';

const AutoSizeInput = styled(TextField)({
  '& .MuiInputBase-root': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'transparent',
    border: 'none',
    padding: '4px',
    borderRadius: '8px',
    '&:before, &:after': {
      display: 'none',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  '& .MuiInputBase-input': {
    padding: 0,
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
  },
}) as React.ComponentType<React.ComponentProps<typeof TextField>>;

const ReadOnly = styled.span({
  padding: '4px',
  border: 'solid 1px transparent',
  borderRadius: 8,
}) as React.ComponentType<React.HTMLProps<HTMLSpanElement>>;

export function InlineTextEdit({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value, readOnly]);

  function handleSubmit() {
    if (input.length === 0) {
      setInput(value);
    } else {
      onChange(input);
    }
  }

  if (readOnly) {
    return <ReadOnly key="readonly">{value}</ReadOnly>;
  }

  return (
    <form
      onSubmit={(e) => {
        handleSubmit();
        e.preventDefault();
      }}
    >
      <AutoSizeInput
        key="autosize"
        variant="standard"
        aria-label={label}
        size="small"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleSubmit}
        InputProps={{
          disableUnderline: true,
        }}
      />

      {/* Required to make submit on enter to work in every env */}
      <input type="submit" hidden />
    </form>
  );
}
