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

import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonProps, Form } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';
import { TextArea } from '../TextArea';
import { TextInput } from '../TextInput';

export type TopicChanges = Partial<{
  title: string;
  description: string;
  pinned: boolean;
}>;

export const TOPIC_MAX_TITLE_LENGTH = 60;
export const TOPIC_MAX_DESCRIPTION_LENGTH = 140;

const TopicForm = styled(Form)(({ theme }) => ({
  '&&&&&': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontStyle: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    background: 'transparent',

    marginRight: -4,
  },

  '&& .ui.label': {
    borderColor: 'rgba(34, 36, 38, 0.15)',
  },

  // reset the styles of all inputs
  '&&&&& input, &&&&& textarea': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',

    background: theme.stickyNoteColor,

    '&:not(:focus)': {
      borderColor: 'rgba(34, 36, 38, 0.15)',
    },

    color: 'black',

    padding: 4,

    '&::placeholder': {
      color: '#595959',
    },
  },

  // make sure the input field overlays the original text
  // and starts slightly to the left and is slightly larger
  '&&&&& .input, &&&&&& > .field': {
    marginLeft: -4,
    width: 'calc(100% + 8px)',
  },

  '& button.basic.button.icon:hover': {
    background: 'unset !important',
  },
}));

const SideBySide = styled.div({
  display: 'flex',
  alignItems: 'flex-start',
  flexDirection: 'row-reverse',
  flexWrap: 'wrap',
  gap: 8,

  '& > *:last-child': {
    flex: '1',
  },

  margin: '0 0 1em',
});

const Title = styled.div({
  fontSize: '1.2em',
  fontWeight: 'bold',
});

const TitleInput = styled(TextInput)({
  '&&&&': {
    margin: 0,
  },

  '&&&&&&& input': {
    fontWeight: 'bold',
    fontSize: '1.2em',
  },
});

const Author = styled.p({
  color: '#434343',
  hyphens: 'auto',
});

const ButtonWithoutMargin = styled(Button)({
  '&&&&&': {
    margin: 0,
  },
});

const Description = styled.p<{ collapsed?: boolean | number }>(
  ({ collapsed }) => ({
    flex: 1,
    whiteSpace: 'pre-wrap',

    '&': collapsed
      ? {
          display: '-webkit-box',
          '-webkit-line-clamp': `${
            typeof collapsed === 'number' ? collapsed : 1
          }`,
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      : {},
  })
);

export type StickyNoteProps = {
  /** The topic title to display */
  title: string;

  /** The topic description to display */
  description: string;

  /** The topic author to display */
  author: string;

  /**
   * Render the sticky note in a collapsed way, taking up less space.
   * Provide a number to control the displayed lines (default 1)
   * */
  collapsed?: boolean | number;

  /**
   * If defined, the topic is editable and this handler will
   * be called on any update. The value will only update if
   * an input is blurred.
   */
  onUpdate?: (changes: TopicChanges) => void;

  /**
   * If defined, the topic is editable and this handler will
   * be called on any update.
   */
  onChange?: (changes: TopicChanges) => void;

  /**
   * Additional content that should be added after the description.
   */
  children?: ReactNode;

  /**
   * Content that is displayed in the top right corner of
   * the sticky node.
   */
  headerSlot?: ReactNode;

  /**
   * Specifies whether the sticky note is large.
   */
  large?: boolean;
};

export const StickyNoteContainer = styled.div<{ large?: boolean }>(
  ({ theme, large }) => ({
    background: theme.stickyNoteColor,
    padding: 8,
    boxShadow: `5px 5px 5px ${theme.borderColor}`,
    color: 'black',
    fontSize: large ? '1.5em' : undefined,
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
  })
);

export function StickyNoteButton(props: ButtonProps) {
  return (
    <ButtonWithoutMargin
      basic
      {...props}
      circular
      compact
      color="black"
      size={props.size ?? 'small'}
    />
  );
}

export function StickyNote(props: StickyNoteProps) {
  const {
    title,
    author,
    description,
    collapsed,
    children,
    onUpdate,
    onChange,
    headerSlot,
    large = false,
  } = props;

  const { t } = useTranslation();

  if ((onUpdate || onChange) && !collapsed) {
    return (
      <StickyNoteContainer large={large}>
        <TopicForm aria-label={title}>
          <SideBySide>
            {headerSlot}
            <div>
              <TitleInput
                label={t('topic.title', 'Title')}
                placeholder={t('topic.titlePlaceholder', 'Your Topic')}
                value={title}
                onChange={(title) => {
                  onChange?.({ title });
                }}
                onBlur={(title) => {
                  onUpdate?.({ title });
                }}
                maxLength={TOPIC_MAX_TITLE_LENGTH}
                lengthZeroText={t(
                  'topic.titleLengthZero',
                  'Please provide a title.'
                )}
                lengthExceededText={t(
                  'topic.titleLengthLimitReached',
                  'Please provide a shorter title.'
                )}
              />

              <Author>{author}</Author>
            </div>
          </SideBySide>

          <TextArea
            rows={4}
            placeholder={t(
              'topic.descriptionPlaceholder',
              'Describe what you want to talk about…'
            )}
            label={t('topic.description', 'Description')}
            value={description}
            onChange={(description) => {
              onChange?.({ description });
            }}
            onBlur={(description) => {
              if (description.length <= TOPIC_MAX_DESCRIPTION_LENGTH) {
                onUpdate?.({ description });
              }
            }}
            maxLength={TOPIC_MAX_DESCRIPTION_LENGTH}
            lengthZeroText={t(
              'topic.descriptionLengthZero',
              'Please provide a description.'
            )}
            lengthExceededText={t(
              'topic.descriptionLengthLimitReached',
              'Please provide a shorter description.'
            )}
          />

          {children}
        </TopicForm>
      </StickyNoteContainer>
    );
  }

  // TODO: Should we also display the user avatar?

  // TODO: Consider using elipsis for author and title?

  return (
    <StickyNoteContainer large={large}>
      <SideBySide>
        {headerSlot}
        <div>
          <Title>{title}</Title>
          <Author>{author}</Author>
        </div>
      </SideBySide>

      <Description collapsed={collapsed}>{description}</Description>

      {children}
    </StickyNoteContainer>
  );
}
