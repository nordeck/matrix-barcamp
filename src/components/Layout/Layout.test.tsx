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
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import {
  mockInitializeLinkableRoom,
  mockInitializeSpaceParent,
  mockLinkedRoom,
  mockParticipantPowerLevelsEvent,
  mockPowerLevelsEvent,
  mockRoomEncryption,
  mockRoomName,
  mockSessionGrid,
  mockTopic,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { NotificationsProvider } from '../NotificationsProvider';
import { Layout } from './Layout';

describe('<Layout>', () => {
  let wrapper: ComponentType<PropsWithChildren<{}>>;
  let widgetApi: MockedWidgetApi;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'waiting-room-topic-0',
        content: {
          title: 'New Information',
          authors: [{ id: '@klaus-durchdenwald' }],
          description:
            'Are there any new metrics, trends, customer feedback, or market influences we should be aware of?',
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'waiting-room-topic-1',
        content: {
          title: 'Upcoming Priorities',
          authors: [{ id: '@guenter-nachtnebel' }],
          description:
            'What are the main priorities we should focus on for next week?',
        },
      })
    );
    widgetApi.mockSendStateEvent(
      mockTopic({
        state_key: 'topic-0',
        content: {
          title: 'Team Review',
          authors: [{ id: '@juergen-vormelker' }],
          description:
            'We share updates on overall progress and anecdotes to give our team an up-to-date understanding of current initiatives.',
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Nilpferd',
              icon: 'hippo',
            },
            {
              id: 'track-1',
              name: 'Frosch',
              icon: 'frog',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-0-planning',
              type: 'common-event',
              startTime: '2022-02-28T09:00:00Z',
              endTime: '2022-02-28T10:00:00Z',
              icon: 'brain',
              summary: 'Begrüßung & Planung',
            },
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T10:00:00Z',
              endTime: '2022-02-28T11:30:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'topic-0',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
          parkingLot: [
            { topicId: 'waiting-room-topic-0' },
            { topicId: 'waiting-room-topic-1' },
          ],
        },
      })
    );

    mockInitializeLinkableRoom(widgetApi);

    wrapper = ({ children }: PropsWithChildren<{}>) => (
      <NotificationsProvider>
        <WidgetApiMockProvider value={widgetApi}>
          <StoreProvider>{children}</StoreProvider>
        </WidgetApiMockProvider>
      </NotificationsProvider>
    );
  });

  it('should render without exploding', async () => {
    render(<Layout />, { wrapper });

    await expect(
      screen.findByRole('region', { name: /parking lot/i })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /session grid/i })
    ).toBeInTheDocument();
  });

  it.skip('should render error message if not in a space', async () => {
    widgetApi.clearStateEvents();

    render(<Layout />, { wrapper });

    await expect(
      screen.findByText(/your matrix room is not part of a matrix space/i)
    ).resolves.toBeInTheDocument();
  });

  it('should render welcome screen for participants if no session grid was found', async () => {
    widgetApi.clearStateEvents();
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: '!room-id' })
    );
    mockInitializeSpaceParent(widgetApi);

    render(<Layout />, { wrapper });

    await expect(
      screen.findByRole('heading', { name: 'Matrix BarCamp Widget' })
    ).resolves.toBeInTheDocument();

    expect(
      screen.getByText(
        /please wait till a moderator has configured the widget/i
      )
    ).toBeInTheDocument();
  });

  it('should render welcome screen for moderators if no session grid was found and setup the widget', async () => {
    widgetApi.clearStateEvents();
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent({ room_id: '!room-id' }));
    mockInitializeSpaceParent(widgetApi);

    render(<Layout />, { wrapper });

    await expect(
      screen.findByRole('heading', { name: 'Matrix BarCamp Widget' })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(/next a moderator has to set up the Lobby room/i)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /setup barcamp/i })
    );

    await waitFor(() => {
      expect(widgetApi.sendStateEvent).toBeCalledTimes(4);
    });

    expect(widgetApi.sendRoomEvent).toBeCalledTimes(1);
    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid.start',
      {}
    );

    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'net.nordeck.barcamp.session_grid',
      {
        consumedTopicSubmissions: [],
        parkingLot: [],
        sessions: [],
        timeSlots: [expect.any(Object)],
        tracks: [expect.any(Object)],
        topicStartEventId: expect.any(String),
      },
      {
        stateKey: '!room-id',
      }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'm.room.history_visibility',
      { history_visibility: 'shared' }
    );
    expect(widgetApi.sendStateEvent).toBeCalledWith('m.room.power_levels', {
      users: {
        '@user-id': 100,
      },
      events: {
        'net.nordeck.barcamp.topic_submission': 50,
      },
    });
    expect(widgetApi.sendStateEvent).toBeCalledWith(
      'io.element.widgets.layout',
      {
        widgets: {
          'widget-id': expect.any(Object),
        },
      }
    );
  });

  it('should render welcome screen and ask for confirmation if setup is performed in an e2ee enabled room', async () => {
    widgetApi.clearStateEvents();
    widgetApi.mockSendStateEvent(mockPowerLevelsEvent({ room_id: '!room-id' }));
    widgetApi.mockSendStateEvent(mockRoomEncryption());
    mockInitializeSpaceParent(widgetApi);

    render(<Layout />, { wrapper });

    await expect(
      screen.findByRole('heading', { name: 'Matrix BarCamp Widget' })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText(/next a moderator has to set up the Lobby room/i)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /setup barcamp/i })
    );

    const confirmModal = screen.getByRole('dialog', { name: 'Encrypted room' });
    expect(confirmModal).toHaveAccessibleDescription(
      /do you really want to setup the barcamp in this room?/i
    );

    await userEvent.click(
      within(confirmModal).getByRole('button', { name: /setup barcamp/i })
    );

    expect(confirmModal).not.toBeInTheDocument();

    await waitFor(() => {
      expect(widgetApi.sendStateEvent).toBeCalledTimes(4);
    });
  });

  it('should move topic inside the parking lot', async () => {
    render(<Layout />, { wrapper });

    const parkingLot = await screen.findByRole('region', {
      name: /parking lot/i,
    });

    expect(
      within(parkingLot)
        .getAllByRole('button', { name: /^(?!.*show details)/i })
        .map((c) => c.textContent)
    ).toEqual([
      expect.stringMatching(/new information/i),
      expect.stringMatching(/upcoming priorities/i),
    ]);

    const topic = within(parkingLot).getByRole('button', {
      name: /upcoming priorities/i,
    });

    topic.focus();

    // Move the element one up by pressing space, arrow up and space to drop it
    // again.
    // While using userEvent.keyboard('{Space}{ArrowUp}{Space}') should be
    // preferred, we can't use it here as rbd uses the keyCode property on the
    // event, however userEvent is not sending it anymore.
    fireEvent.keyDown(topic, { keyCode: 32 /*{Space}*/ });
    fireEvent.keyDown(topic, { keyCode: 38 /*{ArrowUp}*/ });
    fireEvent.keyDown(topic, { keyCode: 32 /*{Space}*/ });

    await waitFor(() =>
      expect(
        within(parkingLot)
          .getAllByRole('button', { name: /^(?!.*show details)/i })
          .map((c) => c.textContent)
      ).toEqual([
        expect.stringMatching(/upcoming priorities/i),
        expect.stringMatching(/new information/i),
      ])
    );
  });

  // TODO: Test other interactions that require moving between different
  // droppable locations. However, we don't have layout in jsdom, which means
  // that rbd doesn't now how to navigate between the individual droppables.

  it('should update the duration of a time slot in edit mode', async () => {
    render(<Layout />, { wrapper });

    // enter edit mode
    await toggleEditMode();

    const timeSlotHeaderEl = screen.getByRole('rowheader', {
      name: /9:00 am 60/i,
    });
    const inputElement = within(timeSlotHeaderEl).getByRole('spinbutton', {
      name: /track duration in minutes/i,
    });

    await userEvent.clear(inputElement);
    await userEvent.type(inputElement, '15');

    // leave edit mode
    await toggleEditMode();

    await expect(
      screen.findByRole('rowheader', { name: /9:00 am 15 min/i })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: /9:15 am 90 min/i })
    ).toBeInTheDocument();
  });

  it('should edit summary of common event', async () => {
    render(<Layout />, { wrapper });

    await toggleEditMode();

    const sessionGrid = screen.getByRole('table', { name: /session grid/i });
    const commonEvent = within(sessionGrid).getByRole('cell', {
      name: /begrüßung & planung/i,
    });
    const input = within(commonEvent).getByRole('textbox', {
      name: /common event title/i,
    });

    expect(input).toHaveValue('Begrüßung & Planung');

    await userEvent.clear(input);
    await userEvent.type(input, 'Hello World');
    await userEvent.tab();

    await toggleEditMode();

    await expect(
      within(commonEvent).findByText('Hello World')
    ).resolves.toBeInTheDocument();
  });

  it('should edit icon of common event', async () => {
    render(<Layout />, { wrapper });

    await toggleEditMode();

    const sessionGrid = screen.getByRole('table', { name: /session grid/i });
    const commonEvent = within(sessionGrid).getByRole('cell', {
      name: /begrüßung & planung/i,
    });
    await userEvent.click(
      within(commonEvent).getByRole('combobox', { name: 'Icon "brain"' })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    await userEvent.click(
      within(list).getByRole('option', { name: 'Icon "star"' })
    );

    await toggleEditMode();

    await expect(
      within(commonEvent).findByRole('img', { name: 'Icon "star"' })
    ).resolves.toBeInTheDocument();
  });

  it('should edit name of track', async () => {
    render(<Layout />, { wrapper });

    await toggleEditMode();

    const sessionGrid = screen.getByRole('table', { name: /session grid/i });
    const trackTitle = within(sessionGrid).getByRole('columnheader', {
      name: 'Frosch',
    });
    const textbox = within(trackTitle).getByDisplayValue('Frosch');

    await userEvent.clear(textbox);
    await userEvent.type(textbox, 'Toat');
    await userEvent.tab();

    await toggleEditMode();

    await expect(
      within(trackTitle).findByText('Toat')
    ).resolves.toBeInTheDocument();
  });

  it('should edit icon of track', async () => {
    render(<Layout />, { wrapper });

    await toggleEditMode();

    const sessionGrid = screen.getByRole('table', { name: /session grid/i });
    const trackTitle = within(sessionGrid).getByRole('columnheader', {
      name: 'Frosch',
    });
    await userEvent.click(
      within(trackTitle).getByRole('combobox', { name: 'Icon "frog"' })
    );

    const list = screen.getByRole('listbox', { name: /available icons/i });

    await userEvent.click(
      within(list).getByRole('option', { name: 'Icon "star"' })
    );

    await toggleEditMode();

    await expect(
      within(trackTitle).findByRole('img', { name: 'Icon "star"' })
    ).resolves.toBeInTheDocument();
  });

  it('should add a new track', async () => {
    render(<Layout />, { wrapper });

    const sessionGrid = await screen.findByRole('table', {
      name: /session grid/i,
    });

    expect(
      within(sessionGrid).queryByRole('button', { name: 'Create a track' })
    ).not.toBeInTheDocument();

    await toggleEditMode();

    await userEvent.click(
      within(sessionGrid).getByRole('button', { name: 'Create a track' })
    );

    const trackTitle = await within(sessionGrid).findByRole('columnheader', {
      name: 'Track 3',
    });

    expect(trackTitle).toBeInTheDocument();
  });

  it('should delete track', async () => {
    render(<Layout />, { wrapper });

    await toggleEditMode();

    const sessionGrid = screen.getByRole('table', { name: /session grid/i });
    const trackTitle = within(sessionGrid).getByRole('columnheader', {
      name: 'Frosch',
    });
    await userEvent.click(
      within(trackTitle).getByRole('button', { name: /delete track/i }),
      { skipHover: true }
    );

    const dialog = screen.getByRole('dialog', { name: /delete the track/i });

    await userEvent.click(
      within(dialog).getByRole('button', { name: /delete/i })
    );

    await waitFor(() => expect(trackTitle).not.toBeInTheDocument());
  });

  it('should delete topic', async () => {
    render(<Layout />, { wrapper });

    const stickyNote = await screen.findByRole('button', {
      name: /team review/i,
    });

    await userEvent.click(
      within(stickyNote).getByRole('button', { name: /show details/i })
    );

    const expandModal = screen.getByRole('dialog');

    await userEvent.click(
      within(expandModal).getByRole('button', { name: 'Delete topic' })
    );

    const deleteModal = screen.getByRole('dialog', {
      name: 'Delete the topic?',
    });
    expect(deleteModal).toHaveAccessibleDescription(
      'Do you want to delete the topic “Team Review”?'
    );

    await userEvent.click(
      within(deleteModal).getByRole('button', { name: 'Delete' })
    );

    await waitFor(() => expect(stickyNote).not.toBeInTheDocument());
  });

  it('should delete time slot', async () => {
    render(<Layout />, { wrapper });

    const sessionGrid = await screen.findByRole('table', {
      name: /session grid/i,
    });

    await toggleEditMode();

    const timeSlot = within(sessionGrid).getByRole('rowheader', {
      name: /9:00 AM 60/i,
    });

    await userEvent.click(
      within(timeSlot).getByRole('button', {
        name: /delete time slot/i,
      }),
      { skipHover: true }
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Delete the time slot?',
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: /delete/i })
    );

    await waitFor(() => expect(timeSlot).not.toBeInTheDocument());
  });

  it('should disable delete track if only a single track is remaining', async () => {
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Nilpferd',
              icon: 'hippo',
            },
          ],
        },
      })
    );

    render(<Layout />, { wrapper });

    await toggleEditMode();

    const sessionGrid = screen.getByRole('table', { name: /session grid/i });

    const trackTitle = within(sessionGrid).getByRole('columnheader', {
      name: 'Nilpferd',
    });
    expect(
      within(trackTitle).getByRole('button', { name: /delete track/i })
    ).toBeDisabled();
  });

  it('should add a new time slot', async () => {
    render(<Layout />, { wrapper });

    const sessionGrid = await screen.findByRole('table', {
      name: /session grid/i,
    });

    await toggleEditMode();

    const listbox = within(sessionGrid).getByRole('listbox', {
      name: 'Create a time slot',
      expanded: false,
    });

    await userEvent.click(listbox, { skipHover: true });
    await userEvent.click(
      within(listbox).getByRole('option', { name: 'Create a time slot' })
    );

    // leave edit mode
    await toggleEditMode();

    await expect(
      screen.findByRole('rowheader', { name: /11:30 am 60 min/i })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: /12:30 pm/i })
    ).toBeInTheDocument();
  });

  it('should add new common event time slot', async () => {
    render(<Layout />, { wrapper });

    const sessionGrid = await screen.findByRole('table', {
      name: /session grid/i,
    });

    await toggleEditMode();

    const listbox = within(sessionGrid).getByRole('listbox', {
      name: 'Create a time slot',
      expanded: false,
    });

    await userEvent.click(listbox, { skipHover: true });
    await userEvent.click(
      within(listbox).getByRole('option', { name: 'Create a common event' })
    );

    // leave edit mode
    await toggleEditMode();

    await expect(
      screen.findByRole('rowheader', { name: /11:30 am 60 min/i })
    ).resolves.toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Break/i })).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: /12:30 pm/i })
    ).toBeInTheDocument();
  });

  it('should reorder time slots', async () => {
    render(<Layout />, { wrapper });

    const sessionGrid = await screen.findByRole('table', {
      name: /session grid/i,
    });

    await toggleEditMode();

    const topic = within(sessionGrid).getByRole('rowheader', {
      name: /10:00 am 90/i,
    });

    topic.focus();

    // Move the element one up by pressing space, one times arrow up and space
    // to drop it again.
    // While using userEvent.keyboard('{Space}{ArrowUp}{Space}')
    // should be preferred, we can't use it here as rbd reads the keyCode
    // property on the event, however userEvent is not sending it anymore.
    fireEvent.keyDown(topic, { keyCode: 32 /*{Space}*/ });
    fireEvent.keyDown(topic, { keyCode: 38 /*{ArrowUp}*/ });
    fireEvent.keyDown(topic, { keyCode: 32 /*{Space}*/ });

    await expect(
      within(sessionGrid).findByRole('rowheader', { name: /9:00 AM 90/i })
    ).resolves.toBeInTheDocument();
  });

  it('should edit the title and description of a session topic', async () => {
    render(<Layout />, { wrapper });

    const stickyNote = await screen.findByRole('button', {
      name: /team review/i,
    });

    await userEvent.click(
      within(stickyNote).getByRole('button', { name: /show details/i })
    );

    const expandModal = screen.getByRole('dialog');

    await userEvent.type(
      within(expandModal).getByLabelText(/title/i),
      ' (updated)'
    );
    await userEvent.type(
      within(expandModal).getByLabelText(/description/i),
      ' (updated)'
    );

    await userEvent.click(
      within(expandModal).getByRole('button', { name: 'Close details' })
    );

    expect(
      within(stickyNote).getByText('Team Review (updated)')
    ).toBeInTheDocument();
    await expect(
      within(stickyNote).findByText(
        'We share updates on overall progress and anecdotes to give our team an up-to-date understanding of current initiatives. (updated)'
      )
    ).resolves.toBeInTheDocument();
  });

  it('should edit the title and description of a parking lot topic', async () => {
    render(<Layout />, { wrapper });

    const parkingLot = await screen.findByRole('region', {
      name: 'Parking Lot',
    });

    const stickyNote = within(parkingLot).getByRole('button', {
      name: /new information/i,
    });

    await userEvent.click(
      within(stickyNote).getByRole('button', { name: /show details/i })
    );

    const expandModal = screen.getByRole('dialog');

    await userEvent.type(
      within(expandModal).getByLabelText(/title/i),
      ' (updated)'
    );
    await userEvent.type(
      within(expandModal).getByLabelText(/description/i),
      ' (updated)'
    );

    await userEvent.click(
      within(expandModal).getByRole('button', { name: 'Close details' })
    );

    expect(
      within(stickyNote).getByText('New Information (updated)')
    ).toBeInTheDocument();
    await expect(
      within(stickyNote).findByText(
        'Are there any new metrics, trends, customer feedback, or market influences we should be aware of? (updated)'
      )
    ).resolves.toBeInTheDocument();
  });

  it.skip('should assign a matrix room to a session topic', async () => {
    render(<Layout />, { wrapper });

    const stickyNote = await screen.findByRole('button', {
      name: /team review/i,
    });

    const linkRoomButton = within(stickyNote).getByRole('button', {
      name: /link room/i,
    });
    await userEvent.click(linkRoomButton);

    const expandModal = screen.getByRole('dialog');

    const assignButton = within(expandModal).getByRole('button', {
      name: 'Assign',
    });
    await waitFor(() => expect(assignButton).not.toBeDisabled());
    await userEvent.click(assignButton);

    await expect(
      within(stickyNote).findByRole('button', {
        name: /switch to the session room/i,
      })
    ).resolves.toBeInTheDocument();

    expect(linkRoomButton).not.toBeInTheDocument();
  });

  it.skip('should navigate to a session room', async () => {
    mockInitializeSpaceParent(widgetApi, { room_id: '!linked-room-id' });
    widgetApi.mockSendStateEvent(mockLinkedRoom());

    render(<Layout />, { wrapper });

    const stickyNote = await screen.findByRole('button', {
      name: /team review/i,
    });

    const switchToSessionButton = await within(stickyNote).findByRole(
      'button',
      { name: /switch to the session room/i }
    );

    await userEvent.click(switchToSessionButton);

    expect(widgetApi.navigateTo).toBeCalledWith(
      'https://matrix.to/#/!linked-room-id?via=matrix.to'
    );
  });

  it.skip('should display the current topic if added to a session room', async () => {
    mockInitializeSpaceParent(widgetApi, { room_id: 'lobby-room-id' });

    widgetApi.mockSendStateEvent(
      mockLinkedRoom({
        state_key: '!room-id',
        content: { sessionGridId: 'lobby-room-id' },
      })
    );
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        state_key: 'lobby-room-id',
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Nilpferd',
              icon: 'hippo',
            },
            {
              id: 'track-1',
              name: 'Frosch',
              icon: 'frog',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-0-planning',
              type: 'common-event',
              startTime: '2022-02-28T09:00:00Z',
              endTime: '2022-02-28T10:00:00Z',
              icon: 'brain',
              summary: 'Begrüßung & Planung',
            },
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T10:00:00Z',
              endTime: '2022-02-28T11:30:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'topic-0',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
          parkingLot: [],
        },
      })
    );

    widgetApi.mockSendStateEvent(
      mockRoomName({
        room_id: 'lobby-room-id',
        content: {
          name: 'Welcome',
        },
      })
    );

    render(<Layout />, { wrapper });

    await expect(
      screen.findByRole('button', { name: /return to “welcome”/i })
    ).resolves.toBeInTheDocument();

    expect(screen.getByText('Nilpferd')).toBeInTheDocument();
    expect(
      screen.getByText('2/28/2022, 10:00 AM–11:30 AM')
    ).toBeInTheDocument();
    expect(screen.getByText('Team Review')).toBeInTheDocument();
    expect(screen.getByText('@juergen-vormelker')).toBeInTheDocument();
    expect(screen.getByText(/We share updates/)).toBeInTheDocument();
  });

  it.skip('should navigate to the lobby room', async () => {
    mockInitializeSpaceParent(widgetApi, { room_id: 'lobby-room-id' });

    widgetApi.mockSendStateEvent(
      mockLinkedRoom({
        state_key: '!room-id',
        content: { sessionGridId: 'lobby-room-id' },
      })
    );
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        state_key: 'lobby-room-id',
        content: {
          tracks: [
            {
              id: 'track-0',
              name: 'Nilpferd',
              icon: 'hippo',
            },
          ],
          timeSlots: [
            {
              id: 'timeslot-1',
              type: 'sessions',
              startTime: '2022-02-28T10:00:00Z',
              endTime: '2022-02-28T11:30:00Z',
            },
          ],
          sessions: [
            {
              topicId: 'topic-0',
              trackId: 'track-0',
              timeSlotId: 'timeslot-1',
            },
          ],
          parkingLot: [],
        },
      })
    );

    render(<Layout />, { wrapper });

    const returnToLobbyButton = await screen.findByRole('button', {
      name: /return to “lobby”/i,
    });

    await userEvent.click(returnToLobbyButton);

    expect(widgetApi.navigateTo).toBeCalledWith(
      'https://matrix.to/#/lobby-room-id?via=matrix.to'
    );
  });

  it('should pin/unpin scheduled topics', async () => {
    render(<Layout />, { wrapper });
    const scheduledStickyNote = await screen.findByRole('button', {
      name: /Team Review/i,
    });

    const expandButton = within(scheduledStickyNote).getByRole('button', {
      name: /show details/i,
    });
    await userEvent.click(expandButton);
    const modal = screen.getByRole('dialog');

    await userEvent.click(
      within(modal).getByRole('button', {
        name: /Fix period/i,
        pressed: false,
      })
    );

    await userEvent.click(
      within(modal).getByRole('button', {
        name: /Release period/i,
        pressed: true,
      })
    );
    expect(
      within(modal).getByRole('button', {
        name: /Fix period/i,
        pressed: false,
      })
    ).toBeInTheDocument();
  });
});

async function toggleEditMode() {
  const sessionGrid = await screen.findByRole('table', {
    name: /session grid/i,
  });

  await userEvent.click(
    within(sessionGrid).getByRole('button', {
      name: /edit tracks and time slots/i,
    }),
    { skipHover: true }
  );
}
