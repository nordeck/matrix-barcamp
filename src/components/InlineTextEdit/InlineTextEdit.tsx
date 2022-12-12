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

import { useEffect, useState } from 'react';
import { Input } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';

const AutoSizeInput = styled(Input)({
  '&&&&&': {
    display: 'inline-grid',

    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'transparent',
  },

  '&&&&& > input, &&&&&::after': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'transparent',
    padding: 4,

    gridArea: '1 / 1',
  },

  // This adds a hidden text node with the same styling and content to
  // automatically sizes the text input to its contents.
  '&&&&&::after': {
    content: "attr(data-value) ' '",
    visibility: 'hidden',
    whiteSpace: 'pre-wrap',

    border: '1px solid transparent',
  },
});

const ReadOnly = styled.span({
  padding: '4px',
  border: 'solid 1px transparent',
  borderRadius: 8,
});

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
    return <ReadOnly>{value}</ReadOnly>;
  }

  return (
    <form
      onSubmit={(e) => {
        handleSubmit();
        e.preventDefault();
      }}
    >
      <AutoSizeInput data-value={input}>
        <input
          aria-label={label}
          size={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={handleSubmit}
        />
      </AutoSizeInput>

      {/* Required to make submit on enter to work in every env */}
      <input type="submit" hidden />
    </form>
  );
}
