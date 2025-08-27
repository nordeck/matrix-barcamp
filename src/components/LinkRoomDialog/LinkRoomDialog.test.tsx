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

import { WidgetApiMockProvider } from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import {
  mockInitializeLinkableRoom,
  mockInitializeSpaceParent,
  mockRoomEncryption,
  mockSessionGrid,
  mockTopic,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { LinkRoomDialog } from './LinkRoomDialog';

describe.skip('<LinkRoomDialog>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let widgetApi: MockedWidgetApi;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(mockSessionGrid());
    widgetApi.mockSendStateEvent(mockTopic());

    mockInitializeLinkableRoom(widgetApi);

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <WidgetApiMockProvider value={widgetApi}>
        <StoreProvider>{children}</StoreProvider>
      </WidgetApiMockProvider>
    );
  });

  it('should assign the room if the trigger is clicked', async () => {
    render(
      <LinkRoomDialog topicId="topic-0">
        <button>Trigger</button>
      </LinkRoomDialog>,
      { wrapper }
    );

    const triggerButton = screen.getByRole('button', { name: 'Trigger' });

    await userEvent.click(triggerButton);

    const modal = screen.getByRole('dialog', {
      name: 'Assign a Matrix room to a topic',
    });
    expect(modal).toHaveAccessibleDescription(/select a matrix room/i);
    expect(
      within(modal).getByRole('textbox', { name: 'Matrix Room' })
    ).toHaveFocus();

    await userEvent.click(
      within(modal).getByRole('button', { name: 'Assign' })
    );

    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });

    await waitFor(() => expect(triggerButton).toHaveFocus());

    expect(widgetApi.sendStateEvent).toBeCalledTimes(7);
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.linked_room',
      { sessionGridId: '!room-id', topicId: 'topic-0' },
      { roomId: '!space-id', stateKey: '!unassigned-room-id' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.name',
      { name: 'My Topic' },
      { roomId: '!unassigned-room-id' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.topic',
      { topic: 'A brief description' },
      { roomId: '!unassigned-room-id' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      expect.objectContaining({
        type: 'net.nordeck.barcamp:clock',
      }),
      { roomId: '!unassigned-room-id', stateKey: 'barcamp' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'im.vector.modular.widgets',
      expect.objectContaining({
        type: 'jitsi',
      }),
      { roomId: '!unassigned-room-id', stateKey: 'jitsi' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          jitsi: expect.any(Object),
          barcamp: expect.any(Object),
        },
      },
      { roomId: '!unassigned-room-id' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.history_visibility',
      { history_visibility: 'shared' },
      { roomId: '!unassigned-room-id' }
    );
  });

  it('should ask for confirmation if the room has e2ee enabled', async () => {
    widgetApi.mockSendStateEvent(
      mockRoomEncryption({ room_id: '!unassigned-room-id' })
    );

    render(
      <LinkRoomDialog topicId="topic-0">
        <button>Trigger</button>
      </LinkRoomDialog>,
      { wrapper }
    );

    const triggerButton = screen.getByRole('button', { name: 'Trigger' });

    await userEvent.click(triggerButton);

    const modal = screen.getByRole('dialog', {
      name: 'Assign a Matrix room to a topic',
    });
    expect(modal).toHaveAccessibleDescription(/select a matrix room/i);
    expect(
      within(modal).getByRole('textbox', { name: 'Matrix Room' })
    ).toHaveFocus();

    await userEvent.click(
      within(modal).getByRole('button', { name: 'Assign' })
    );

    const confirmModal = screen.getByRole('dialog', { name: 'Encrypted room' });
    expect(confirmModal).toHaveAccessibleDescription(
      /do you really want to assign this room?/i
    );

    await userEvent.click(
      within(confirmModal).getByRole('button', { name: 'Assign' })
    );

    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });

    expect(widgetApi.sendStateEvent).toBeCalledTimes(7);
  });

  it('should do nothing if the user cancels the dialog', async () => {
    render(
      <LinkRoomDialog topicId="topic-0">
        <button>Trigger</button>
      </LinkRoomDialog>,
      { wrapper }
    );

    const triggerButton = screen.getByRole('button', { name: 'Trigger' });

    await userEvent.click(triggerButton);

    const modal = screen.getByRole('dialog', {
      name: 'Assign a Matrix room to a topic',
    });
    expect(modal).toHaveAccessibleDescription(/select a matrix room/i);
    expect(
      within(modal).getByRole('textbox', { name: 'Matrix Room' })
    ).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(modal).not.toBeInTheDocument();
    await waitFor(() => expect(triggerButton).toHaveFocus());

    expect(widgetApi.sendStateEvent).not.toBeCalled();
  });

  it('should not submit the room if it is no longer part of the unassigned rooms', async () => {
    render(
      <LinkRoomDialog topicId="topic-0">
        <button>Trigger</button>
      </LinkRoomDialog>,
      { wrapper }
    );

    const triggerButton = screen.getByRole('button', { name: 'Trigger' });

    await userEvent.click(triggerButton);

    const modal = screen.getByRole('dialog', {
      name: 'Assign a Matrix room to a topic',
    });
    expect(modal).toHaveAccessibleDescription(/select a matrix room/i);
    expect(
      within(modal).getByRole('textbox', { name: 'Matrix Room' })
    ).toHaveFocus();

    const button = within(modal).getByRole('button', { name: 'Assign' });
    expect(button).not.toBeDisabled();

    widgetApi.mockSendStateEvent(
      mockSessionGrid({ state_key: '!unassigned-room-id' })
    );

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
