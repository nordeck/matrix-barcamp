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

import { useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import {
  Popover,
  List,
  ListItem,
  ListItemButton,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useId } from '../utils';
import { iconSet } from './icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const GridContainer = styled(List)({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, auto)',
  gap: 8,
});

// Removed ForceFocus as it's not needed with MUI ListItemButton

function IconGrid({
  id,
  selected,
  icons,
  onChange,
  onSubmit,
}: {
  id: string;
  selected?: IconDefinition;
  icons: IconDefinition[];
  onChange: (icon: IconDefinition) => void;
  onSubmit: (icon: IconDefinition) => void;
}) {
  const { t } = useTranslation();

  return (
    <GridContainer
      id={id}
      role="listbox"
      aria-label={t('iconPicker.icons', 'Available Icons')}
    >
      {icons.map((icon, i) => (
        <ListItem key={icon.iconName} disablePadding>
          <ListItemButton
            selected={icon === selected}
            role="option"
            aria-selected={icon === selected}
            aria-label={t('iconPicker.icon', 'Icon "{{icon}}"', {
              icon: icon.iconName,
            })}
            onFocus={() => onChange(icon)}
            onClick={() => onSubmit(icon)}
            onKeyDown={(e: React.KeyboardEvent) => {
              const isSubmit = e.code === 'Space' || e.code === 'Enter';
              const isPrevious = e.code === 'ArrowLeft' || e.code === 'ArrowUp';
              const isNext = e.code === 'ArrowRight' || e.code === 'ArrowDown';
              const isFirst = e.code === 'Home';
              const isLast = e.code === 'End';

              if (isSubmit) {
                onSubmit(icon);
                // If we don't prevent, enter reopens the popup immediately
                e.preventDefault();
              } else if (isPrevious) {
                onChange(icons[i === 0 ? icons.length - 1 : i - 1]);
              } else if (isNext) {
                onChange(icons[(i + 1) % icons.length]);
              } else if (isFirst) {
                onChange(icons[0]);
              } else if (isLast) {
                onChange(icons[icons.length - 1]);
              }
            }}
          >
            <FontAwesomeIcon icon={icon} size="xl" />
          </ListItemButton>
        </ListItem>
      ))}
    </GridContainer>
  );
}

type IconSizeProp = 'small' | 'medium' | 'large';

export type IconPickerProps = {
  size?: IconSizeProp;
  icon: IconDefinition;
  readOnly?: boolean;
  onChange: (icon: IconDefinition) => void;
};

export function IconPicker({
  size,
  icon,
  readOnly,
  onChange,
}: IconPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(icon);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  if (readOnly) {
    return (
      <span
        role="img"
        aria-label={t('iconPicker.icon', 'Icon "{{icon}}"', {
          icon: icon.iconName,
        })}
      >
        <FontAwesomeIcon icon={icon} size="xl" />
      </span>
    );
  }

  const displayedIcon = open ? selectedIcon : icon;

  return (
    <>
      <div aria-label={t('iconPicker.title', 'Pick an icon')}>
        <IconButton
          ref={buttonRef}
          size={size}
          role="combobox"
          aria-label={t('iconPicker.icon', 'Icon "{{icon}}"', {
            icon: displayedIcon.iconName,
          })}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setSelectedIcon(icon);
              setOpen(true);
            }
          }}
        >
          <FontAwesomeIcon icon={displayedIcon} size="xs" />
        </IconButton>
      </div>
      <Popover
        open={open}
        anchorEl={buttonRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
      <FocusLock
        autoFocus={false}
        onDeactivation={() => {
          // Restore focus to the button once the popup is closed. While
          // FocusLock can do this automatically, it doesn't work in our case as
          // we changing the focus inside the trap to early.
          buttonRef.current?.focus();
        }}
      >
        <IconGrid
          id={listId}
          icons={iconSet}
          selected={selectedIcon}
          onChange={(newIcon) => setSelectedIcon(newIcon)}
          onSubmit={(icon) => {
            setOpen(false);
            setSelectedIcon(icon);
            onChange(icon);
          }}
        />
      </FocusLock>
      </Popover>
    </>
  );
}
