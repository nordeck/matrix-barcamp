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

import { RoomEvent } from '@matrix-widget-toolkit/api';
import { SerializedError } from '@reduxjs/toolkit';
import { TopicSubmissionEvent } from '../../lib/events';
import { BaseApiError } from './baseApi';
import { useGetSessionGridQuery } from './sessionGridApi';
import {
  selectAvailableSubmittedTopics,
  useGetTopicSubmissionsQuery,
} from './topicSubmissionApi';

export type UseAvailableTopicSubmissions = {
  data?: RoomEvent<TopicSubmissionEvent>[];
  error?: BaseApiError | SerializedError | undefined;
  isLoading: boolean;
};

export function useAvailableTopicSubmissions(): UseAvailableTopicSubmissions {
  const {
    data: topicSubmissionsData,
    isLoading: topicSubmissionsIsLoading,
    error: topicSubmissionsError,
  } = useGetTopicSubmissionsQuery();
  const {
    data: sessionGridData,
    isLoading: sessionGridIsLoading,
    error: sessionGridError,
  } = useGetSessionGridQuery();

  if (topicSubmissionsData && sessionGridData?.event) {
    return {
      data: selectAvailableSubmittedTopics(
        topicSubmissionsData,
        sessionGridData.event?.content.consumedTopicSubmissions ?? []
      ),
      isLoading: false,
    };
  }

  return {
    isLoading: topicSubmissionsIsLoading || sessionGridIsLoading,
    error: topicSubmissionsError ?? sessionGridError,
  };
}
