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

import { first } from 'lodash';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownItemProps } from 'semantic-ui-react';
import { useGetUnassignedRoomsQuery } from '../../store';

export function SelectUnassignedRoomDropdown({
  id,
  roomId,
  onChange,
}: {
  id?: string;
  roomId: string | undefined;
  onChange: (roomId: string | undefined) => void;
}) {
  const { t } = useTranslation();
  const { data: unassignedRooms = [] } = useGetUnassignedRoomsQuery();

  useEffect(() => {
    // select the first room
    if (roomId === undefined && unassignedRooms.length > 0) {
      onChange(unassignedRooms[0].roomId);
    }

    // unselect a room if the room is no longer unassigned
    if (roomId && !unassignedRooms.some((r) => r.roomId)) {
      onChange(first(unassignedRooms)?.roomId);
    }
  }, [onChange, roomId, unassignedRooms]);

  const options = unassignedRooms.map<DropdownItemProps>((r) => ({
    key: r.roomId,
    value: r.roomId,
    text: r.roomName,
  }));

  return (
    <Dropdown
      selection
      placeholder={t('linkRoomDialog.roomPlaceholder', 'Select Room')}
      fluid
      options={options}
      value={roomId}
      searchInput={{ id }}
      onChange={(_, v) => onChange(v.value?.toString())}
      search
      noResultsMessage={t(
        'linkRoomDialog.roomNoResults',
        'Please create a new room in this space.'
      )}
    />
  );
}
