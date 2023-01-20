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

import {
  ThemeSelectionProvider,
  WidgetApiMockProvider,
} from '@matrix-widget-toolkit/react';
import { MockedWidgetApi, mockWidgetApi } from '@matrix-widget-toolkit/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentType, PropsWithChildren } from 'react';
import {
  mockInitializeSpaceParent,
  mockParticipantPowerLevelsEvent,
  mockSessionGrid,
  mockSessionGridStart,
  mockTopicSubmission,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import { StyledComponentsThemeProvider } from '../StyledComponentsThemeProvider';
import { SubmittedTopics } from './SubmittedTopics';

describe('<SubmittedTopics>', () => {
  let widgetApi: MockedWidgetApi;
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();

    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendRoomEvent(mockSessionGridStart());
    widgetApi.mockSendStateEvent(mockSessionGrid());

    wrapper = ({ children }) => {
      return (
        <ThemeSelectionProvider>
          <StyledComponentsThemeProvider>
            <WidgetApiMockProvider value={widgetApi}>
              <StoreProvider>{children}</StoreProvider>
            </WidgetApiMockProvider>
          </StyledComponentsThemeProvider>
        </ThemeSelectionProvider>
      );
    };

    mockInitializeSpaceParent(widgetApi);

    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Goals',
          description:
            'Discussing goals in a group setting can be fun and useful.',
        },
        origin_server_ts: 0,
        event_id: '$event-0',
        sender: '@klaus-durchdenwald',
      })
    );
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Predictions',
          description:
            'It can be fun to make forecasts about the industry and the company…',
        },
        origin_server_ts: 1,
        event_id: '$event-1',
        sender: '@guenter-nachtnebel',
      })
    );
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Fails',
          description:
            'Everybody makes mistakes from time to time. Owning up to failures…',
        },
        origin_server_ts: 2,
        event_id: '$event-2',
        sender: '@karl-handschuh',
      })
    );
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Hypotheticals',
          description:
            'Hypotheticals are fun tangents to explore in work meetings. ',
        },
        origin_server_ts: 3,
        event_id: '$event-3',
        sender: '@walter-trinkenschuh',
      })
    );
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Moonshots',
          description:
            'Moonshots are ambitious ideas that may seem impossible at first glance.',
        },
        origin_server_ts: 4,
        event_id: '$event-4',
        sender: '@uwe-bierhals',
      })
    );
  });

  it('should render empty state', () => {
    widgetApi.clearRoomEvents();
    render(<SubmittedTopics onSelectNextTopic={() => {}} />, { wrapper });

    expect(screen.getByText(/no suggestions/i)).toBeInTheDocument();
  });

  it('should render one topic', async () => {
    widgetApi.clearRoomEvents({ type: 'net.nordeck.barcamp.topic_submission' });
    widgetApi.mockSendRoomEvent(
      mockTopicSubmission({
        content: {
          title: 'Goals',
          description:
            'Discussing goals in a group setting can be fun and useful.',
        },
        origin_server_ts: 0,
        event_id: '$event-0',
        sender: '@klaus-durchdenwald',
      })
    );

    render(<SubmittedTopics onSelectNextTopic={() => {}} />, {
      wrapper,
    });

    await expect(
      screen.findByText(/suggestion from @klaus-durchdenwald/i)
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /select next topic/i })
    ).toBeInTheDocument();
  });

  it('should render multiple topics with the sender and the topic', async () => {
    render(<SubmittedTopics onSelectNextTopic={() => {}} />, { wrapper });

    await expect(
      screen.findByText(/suggestions from @klaus-durchdenwald and 4 more/i)
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /select next topic/i })
    ).toBeInTheDocument();

    await userEvent.hover(
      screen.getByText(/suggestions from @klaus-durchdenwald and 4 more/i)
    );

    await expect(
      screen.findByText(/topic suggestions/i)
    ).resolves.toBeInTheDocument();

    expect(screen.getAllByRole('listitem').map((e) => e.textContent)).toEqual([
      '@klaus-durchdenwaldGoals',
      '@guenter-nachtnebelPredictions',
      '@karl-handschuhFails',
      '@walter-trinkenschuhHypotheticals',
      '@uwe-bierhalsMoonshots',
    ]);
  });

  it('should select the next topic', async () => {
    const onSelectNextTopic = jest.fn();

    render(<SubmittedTopics onSelectNextTopic={onSelectNextTopic} />, {
      wrapper,
    });

    await userEvent.click(
      await screen.findByRole('button', { name: /select next topic/i })
    );

    expect(onSelectNextTopic).toBeCalledTimes(1);
  });

  it('should hide select the next topic for participants', async () => {
    widgetApi.mockSendStateEvent(
      mockParticipantPowerLevelsEvent({ room_id: '!space-id' })
    );

    render(<SubmittedTopics onSelectNextTopic={() => {}} />, { wrapper });

    expect(
      screen.queryByRole('button', { name: /select next topic/i })
    ).not.toBeInTheDocument();
  });
});
