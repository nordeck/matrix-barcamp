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
import { last } from 'lodash';
import React, { ComponentType, PropsWithChildren, useEffect } from 'react';
import {
  mockInitializeSpaceParent,
  mockParticipantPowerLevelsEvent,
  mockPowerLevelsEvent,
  mockSessionGrid,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import {
  PersonalTopicsContextProvider,
  usePersonalTopics,
} from './PersonalTopicsContextProvider';
import { TopicList } from './TopicList';
import { PersonalTopic } from './types';

describe('<TopicList/>', () => {
  const topicsFn = jest.fn<void, [PersonalTopic[]]>();

  let widgetApi: MockedWidgetApi;
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(mockSessionGrid());
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 0,
          },
        },
      })
    );

    wrapper = ({ children }) => {
      // forward updates in a topic to a mock for later assertion
      const Component = () => {
        const { topics } = usePersonalTopics();

        useEffect(() => {
          topicsFn(topics);
        }, [topics]);

        return <React.Fragment />;
      };
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <StoreProvider>
            <PersonalTopicsContextProvider>
              {children}
              <Component />
            </PersonalTopicsContextProvider>
          </StoreProvider>
        </WidgetApiMockProvider>
      );
    };

    localStorage.clear();
  });

  it('should render without exploding', () => {
    render(<TopicList />, { wrapper });

    expect(
      screen.getByRole('button', { name: /create new topic/i })
    ).toBeInTheDocument();
  });

  it('should create a new topic', async () => {
    render(<TopicList />, { wrapper });

    await userEvent.click(
      screen.getByRole('button', { name: /create new topic/i })
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should delete a topic', async () => {
    render(<TopicList />, { wrapper });

    await userEvent.click(
      screen.getByRole('button', { name: /create new topic/i })
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }), {
      skipHover: true,
    });

    const dialog = screen.getByRole('dialog', {
      name: /delete the topic suggestion/i,
    });

    await userEvent.click(
      within(dialog).getByRole('button', { name: /delete/i })
    );

    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  it('should update a topic', async () => {
    render(<TopicList />, { wrapper });

    await userEvent.click(
      screen.getByRole('button', { name: /create new topic/i })
    );

    await userEvent.type(screen.getByLabelText(/title/i), 'My Example Topic');
    await userEvent.type(
      screen.getByLabelText(/description/i),
      'A very good topic'
    );
    await userEvent.tab();

    expect(topicsFn).toHaveBeenLastCalledWith([
      {
        localId: expect.any(String),
        title: 'My Example Topic',
        description: 'A very good topic',
      },
    ]);
  });

  it('should submit a topic', async () => {
    render(<TopicList />, { wrapper });

    await userEvent.click(
      screen.getByRole('button', { name: /create new topic/i })
    );

    const stickyNote = screen.getByRole('form');
    await userEvent.type(
      within(stickyNote).getByLabelText(/title/i),
      'My Example Topic'
    );
    await userEvent.type(
      within(stickyNote).getByLabelText(/description/i),
      'A very good topic'
    );

    await userEvent.click(
      within(stickyNote).getByRole('button', { name: /submit/i })
    );

    expect(stickyNote).not.toBeInTheDocument();
    expect(topicsFn).toHaveBeenLastCalledWith([
      {
        localId: expect.any(String),
        title: 'My Example Topic',
        description: 'A very good topic',
        topicId: expect.any(String),
      },
    ]);

    expect(widgetApi.sendRoomEvent).toBeCalledWith(
      'net.nordeck.barcamp.topic_submission',
      {
        title: 'My Example Topic',
        description: 'A very good topic',
      }
    );

    // check if the sticky note is displayed as submitted
    expect(screen.getByText('My Example Topic')).toBeInTheDocument();
    expect(screen.getByText('A very good topic')).toBeInTheDocument();
    expect(screen.getByText('@user-id')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Already Submitted' })
    ).toBeInTheDocument();

    // add the submission to the grid
    widgetApi.mockSendStateEvent(
      mockSessionGrid({
        content: {
          consumedTopicSubmissions: [
            last(topicsFn.mock.calls)?.[0][0].topicId ?? '',
          ],
        },
      })
    );

    await waitFor(() => {
      expect(screen.queryByText('My Example Topic')).not.toBeInTheDocument();
    });
  });

  it('should show a message and disable submission if submission is closed for participants', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
      })
    );

    render(<TopicList />, { wrapper });

    // Check submit button
    await userEvent.click(
      screen.getByRole('button', { name: /create new topic/i })
    );

    const stickyNote = screen.getByRole('form');
    await userEvent.type(
      within(stickyNote).getByLabelText(/title/i),
      'My Example Topic'
    );
    await userEvent.type(
      within(stickyNote).getByLabelText(/description/i),
      'A very good topic'
    );

    expect(
      within(stickyNote).getByRole('button', { name: /submit/i })
    ).toBeDisabled();

    // Check message
    expect(screen.getByText('Submission closed')).toBeInTheDocument();
    expect(
      screen.getByText(/Topic submission is not open yet/i)
    ).toBeInTheDocument();
  });

  it('should show a message if submission is closed for moderators', async () => {
    widgetApi.mockSendStateEvent(
      mockPowerLevelsEvent({
        content: {
          events: {
            'net.nordeck.barcamp.topic_submission': 50,
          },
        },
      })
    );

    render(<TopicList />, { wrapper });

    // Check submit button
    await userEvent.click(
      screen.getByRole('button', { name: /create new topic/i })
    );

    const stickyNote = screen.getByRole('form');
    await userEvent.type(
      within(stickyNote).getByLabelText(/title/i),
      'My Example Topic'
    );
    await userEvent.type(
      within(stickyNote).getByLabelText(/description/i),
      'A very good topic'
    );

    expect(
      within(stickyNote).getByRole('button', { name: /submit/i })
    ).not.toBeDisabled();

    // Check message
    expect(screen.getByText('Submission closed')).toBeInTheDocument();
    expect(
      screen.getByText(/Topic submission is not open yet/i)
    ).toBeInTheDocument();
  });
});
