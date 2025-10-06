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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { Add } from '@mui/icons-material';
import { TimeSlotTypes } from '../../lib/events';
import { Tooltip } from '../Tooltip';

export function AddTimeSlotButton({
  onAddTimeSlot,
}: {
  onAddTimeSlot: (timeSlotType: TimeSlotTypes) => void;
}) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);
  const label = t(
    'sessionGrid.timeSlot.createSessionsTimeSlot',
    'Create a time slot'
  );

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (timeSlotType: TimeSlotTypes) => {
    onAddTimeSlot(timeSlotType);
    handleClose();
  };

  return (
    <>
      <Tooltip content={label} suppress={isOpen}>
        <IconButton
          size="large"
          aria-label={label}
          onClick={handleClick}
          aria-controls={isOpen ? 'add-timeslot-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={isOpen ? 'true' : undefined}
        >
          <Add />
        </IconButton>
      </Tooltip>
      <Menu
        id="add-timeslot-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'add-timeslot-button',
        }}
      >
        <MenuItem onClick={() => handleSelect('sessions')}>
          {label}
        </MenuItem>
        <MenuItem onClick={() => handleSelect('common-event')}>
          {t(
            'sessionGrid.timeSlot.createCommonEventTimeSlot',
            'Create a common event'
          )}
        </MenuItem>
      </Menu>
    </>
  );
}
