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

import React from 'react';
import { useGetSessionGridQuery, useSessionTopic } from '../../store';
import { LoaderLayout } from './LoaderLayout';
import { LobbyLayout } from './LobbyLayout';
import { NoSpaceMessage } from './NoSpaceMessage';
import { SessionLayout } from './SessionLayout';
import { WelcomeLayout } from './WelcomeLayout';

export function Layout() {
  const { data, isLoading } = useGetSessionGridQuery();
  const { session } = useSessionTopic();

  if (isLoading) {
    return <LoaderLayout />;
  }

  if (data?.error === 'NoSpace') {
    return <NoSpaceMessage />;
  }

  if (data?.error === 'NoSessionGrid' || !data?.event) {
    return <WelcomeLayout />;
  }

  const {
    timeSlots,
    tracks,
    parkingLot: parkingLotTopics,
    sessions,
  } = data.event.content;

  if (session) {
    return (
      <SessionLayout
        sessionGridId={data.event.state_key}
        tracks={tracks}
        timeSlots={timeSlots}
        session={session}
      />
    );
  }

  return (
    <LobbyLayout
      tracks={tracks}
      timeSlots={timeSlots}
      sessions={sessions}
      parkingLotTopics={parkingLotTopics}
    />
  );
}
