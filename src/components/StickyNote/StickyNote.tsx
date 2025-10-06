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
import { IconButton, IconButtonProps } from '@mui/material';
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

const TopicForm = styled.form(({ theme }) => ({
  fontSize: 'inherit',
  fontWeight: 'inherit',
  fontStyle: 'inherit',
  lineHeight: 'inherit',
  color: 'inherit',
  background: 'transparent',
  marginRight: -4,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,

  '& .MuiInputBase-root': {
    fontSize: 'inherit',
    fontWeight: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    backgroundColor: theme.stickyNoteColor,
    color: 'black',

    '& input, & textarea': {
      padding: 4,
      color: 'black',
      backgroundColor: theme.stickyNoteColor,

      '&::placeholder': {
        color: '#595959',
        opacity: 1,
      },
    },
  },

  '& .MuiFormControl-root': {
    marginLeft: -4,
    width: 'calc(100% + 8px)',
  },

  '& .MuiIconButton-root:hover': {
    backgroundColor: 'transparent',
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

const ButtonWithoutMargin = styled(IconButton)({
  margin: 0,
  color: 'black',
  padding: 4,
  minWidth: 'auto',
  minHeight: 'auto',
  border: '1px solid rgba(34, 36, 38, 0.15)',
  borderRadius: '50%',
  backgroundColor: 'transparent',
  
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
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

export function StickyNoteButton(props: IconButtonProps) {
  return (
    // @ts-ignore - styled-components JSX component type issue
    <ButtonWithoutMargin
      {...props}
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
      // @ts-ignore - styled-components JSX component type issue
      <StickyNoteContainer large={large}>
        {/* @ts-ignore - styled-components JSX component type issue */}
        <TopicForm aria-label={title}>
          {/* @ts-ignore - styled-components JSX component type issue */}
          <SideBySide>
            {headerSlot}
            <div>
              {/* @ts-ignore - styled-components JSX component type issue */}
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

              {/* @ts-ignore - styled-components JSX component type issue */}
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
    // @ts-ignore - styled-components JSX component type issue
    <StickyNoteContainer large={large}>
      {/* @ts-ignore - styled-components JSX component type issue */}
      <SideBySide>
        {headerSlot}
        <div>
          {/* @ts-ignore - styled-components JSX component type issue */}
          <Title>{title}</Title>
          {/* @ts-ignore - styled-components JSX component type issue */}
          <Author>{author}</Author>
        </div>
      </SideBySide>

      {/* @ts-ignore - styled-components JSX component type issue */}
      <Description collapsed={collapsed}>{description}</Description>

      {children}
    </StickyNoteContainer>
  );
}
