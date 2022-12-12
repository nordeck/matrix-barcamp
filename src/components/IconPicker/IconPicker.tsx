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
import FocusLock from 'react-focus-lock';
import { useTranslation } from 'react-i18next';
import { Button, Icon, IconProps, List, Popup, Ref } from 'semantic-ui-react';
import { styled } from '../StyledComponentsThemeProvider';
import { useId } from '../utils';
import { iconSet } from './icons';

const GridContainer = styled(List)({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, auto)',
  gap: 8,
});

function ForceFocus({ focus, ...props }: { focus: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focus) {
      ref.current?.focus();
    }
  }, [ref, focus]);

  return <div ref={ref} tabIndex={0} {...props} />;
}

function IconGrid({
  id,
  selected,
  icons,
  onChange,
  onSubmit,
}: {
  id: string;
  selected?: string;
  icons: string[];
  onChange: (icon: string) => void;
  onSubmit: (icon: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <GridContainer
      id={id}
      selection
      role="listbox"
      aria-label={t('iconPicker.icons', 'Available Icons')}
    >
      {icons.map((icon, i) => (
        <List.Item
          key={icon}
          as={ForceFocus}
          focus={icon === selected}
          role="option"
          active={icon === selected}
          aria-selected={icon === selected}
          aria-label={t('iconPicker.icon', 'Icon "{{icon}}"', {
            icon,
          })}
          onFocus={() => onChange(icon)}
          onClick={() => onSubmit(icon)}
          onKeyDown={(e: KeyboardEvent) => {
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
          <Icon size="large" className={icon} />
        </List.Item>
      ))}
    </GridContainer>
  );
}

type IconSizeProp = IconProps['size'];

export type IconPickerProps = {
  size?: IconSizeProp;
  icon: string;
  readOnly?: boolean;
  onChange: (icon: string) => void;
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
          icon,
        })}
      >
        <Icon size={size} className={icon} />
      </span>
    );
  }

  const displayedIcon = open ? selectedIcon : icon;

  return (
    <Popup
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      onOpen={() => {
        setSelectedIcon(icon);
        setOpen(true);
      }}
      trigger={
        <div aria-label={t('iconPicker.title', 'Pick an icon')}>
          <Ref innerRef={buttonRef}>
            <Button
              size={size}
              icon
              circular
              role="combobox"
              aria-label={t('iconPicker.icon', 'Icon "{{icon}}"', {
                icon: displayedIcon,
              })}
              aria-expanded={open}
              aria-controls={listId}
            >
              <Icon className={displayedIcon} />
            </Button>
          </Ref>
        </div>
      }
      on="click"
      position="bottom left"
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
    </Popup>
  );
}
