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

import { useWidgetApi } from '@matrix-widget-toolkit/react';
import { useLocalStorageValue } from '@react-hookz/web';
import { isPlainObject } from 'lodash';
import { nanoid } from 'nanoid';
import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  ReducerWithoutAction,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useGetSessionGridQuery } from '../../store';
import {
  TOPIC_MAX_DESCRIPTION_LENGTH,
  TOPIC_MAX_TITLE_LENGTH,
} from '../StickyNote';
import { PersonalTopic } from './types';

type PersonalTopicsState = {
  topics: PersonalTopic[];
  createTopic: () => void;
  updateTopic: (
    id: string,
    content: Partial<Omit<PersonalTopic, 'id'>>
  ) => void;
  removeTopic: (id: string) => void;
  isValidTopic: (topic: PersonalTopic) => boolean;
};

const PersonalTopicsContext = createContext<PersonalTopicsState | undefined>(
  undefined
);

export function usePersonalTopics(): PersonalTopicsState {
  const context = useContext(PersonalTopicsContext);
  if (context === undefined) {
    throw new Error(
      'usePersonalTopics must be used within a PersonalTopicsContextProvider'
    );
  }
  return context;
}

export function validatePersonalTopics(topics: unknown): PersonalTopic[] {
  if (Array.isArray(topics)) {
    return topics
      .map((t) => {
        if (
          isPlainObject(t) &&
          typeof t.localId === 'string' &&
          typeof t.title === 'string' &&
          typeof t.description === 'string' &&
          (t.topicId === undefined || typeof t.topicId === 'string')
        ) {
          return t;
        }

        return undefined;
      })
      .filter((a): a is PersonalTopic => a !== undefined);
  }

  return [];
}

export function useLocalPersonalTopics(
  roomId: string,
  userId: string
): [PersonalTopic[], Dispatch<ReducerWithoutAction<PersonalTopic[]>>] {
  const storageKey = `net.nordeck.barcamp.${encodeURIComponent(
    roomId
  )}.${encodeURIComponent(userId)}.topics`;
  const [topicsInternal, setTopicsInternal] = useLocalStorageValue<
    PersonalTopic[]
  >(storageKey, []);

  const setTopics = useCallback(
    (updateFn: ReducerWithoutAction<PersonalTopic[]>) => {
      setTopicsInternal((prevRaw) => {
        const prev = validatePersonalTopics(prevRaw);
        return updateFn(prev);
      });
    },
    [setTopicsInternal]
  );

  const topics = useMemo(
    () => validatePersonalTopics(topicsInternal),
    [topicsInternal]
  );

  return [topics, setTopics];
}

type PersonalTopicsContextProviderProps = PropsWithChildren<{}>;

export function PersonalTopicsContextProvider({
  children,
}: PersonalTopicsContextProviderProps) {
  const { widgetParameters } = useWidgetApi();

  const [topics, setTopics] = useLocalPersonalTopics(
    widgetParameters.roomId ?? '',
    widgetParameters.userId ?? ''
  );

  const { data: sessionGrid } = useGetSessionGridQuery();

  const context = useMemo<PersonalTopicsState>(
    () => ({
      topics: topics.filter(
        (t) =>
          !t.topicId ||
          !sessionGrid?.event ||
          !sessionGrid.event.content.consumedTopicSubmissions.includes(
            t.topicId
          )
      ),
      createTopic: () => {
        setTopics((prev) => [
          ...prev,
          { localId: nanoid(), title: '', description: '' },
        ]);
      },
      updateTopic: (id, update) => {
        setTopics((prev) =>
          prev.map((o) => (o.localId === id ? { ...o, ...update } : o))
        );
      },
      removeTopic: (id) => {
        setTopics((prev) => prev.filter((o) => o.localId !== id));
      },
      isValidTopic: (topic) => {
        return (
          topic.title.trim().length > 0 &&
          topic.description.trim().length > 0 &&
          topic.title.length <= TOPIC_MAX_TITLE_LENGTH &&
          topic.description.length <= TOPIC_MAX_DESCRIPTION_LENGTH
        );
      },
    }),
    [sessionGrid?.event, setTopics, topics]
  );

  return (
    <PersonalTopicsContext.Provider value={context}>
      {children}
    </PersonalTopicsContext.Provider>
  );
}
