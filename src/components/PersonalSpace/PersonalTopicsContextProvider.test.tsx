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
import { fireEvent, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { ComponentType, PropsWithChildren } from 'react';
import {
  mockInitializeSpaceParent,
  mockSessionGrid,
} from '../../lib/testUtils';
import { StoreProvider } from '../../store';
import {
  PersonalTopicsContextProvider,
  useLocalPersonalTopics,
  usePersonalTopics,
  validatePersonalTopics,
} from './PersonalTopicsContextProvider';

describe('validatePersonalTopics', () => {
  it('should work', () => {
    expect(
      validatePersonalTopics([
        { localId: '0', title: 'Title', description: 'Description' },
        {
          localId: '1',
          title: 'Title',
          description: 'Description',
          topicId: 'id',
        },
      ])
    ).toEqual([
      { localId: '0', title: 'Title', description: 'Description' },
      {
        localId: '1',
        title: 'Title',
        description: 'Description',
        topicId: 'id',
      },
    ]);
  });

  it('should ignore invalid array entries', () => {
    expect(
      validatePersonalTopics([
        {},
        { localId: 'title-type', title: 1, description: '' },
        { localId: 'desc-type', title: '', description: 1 },
        { localId: ['id-type'], title: '', description: '' },
        { localId: 'topicId-type', title: '', description: '', topicId: 1 },
        { localId: 'works', title: '', description: '' },
      ])
    ).toEqual([{ localId: 'works', title: '', description: '' }]);
  });
});

describe('useLocalPersonalTopics', () => {
  const localStorageKey = 'net.nordeck.barcamp.!my-room.%40user-id.topics';
  const mockTopicsString =
    '[{"localId":"0","title":"My Title","description":"My Description"}]';

  const oldConsoleWarn = console.warn;

  beforeEach(() => {
    localStorage.clear();

    // Hide warnings in the console, produced by the react-hookz package
    // internally
    console.warn = () => {};
  });

  afterEach(() => {
    console.warn = oldConsoleWarn;
  });

  it.each`
    input
    ${''}
    ${'{'}
    ${'[]'}
    ${'[{}]'}
    ${'{}'}
  `('should resolve to empty array for $input', ({ input }) => {
    localStorage.setItem(localStorageKey, input);
    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    expect(result.current[0]).toEqual([]);
  });

  it('should ignore invalid array entries', () => {
    localStorage.setItem(
      localStorageKey,
      `[
      {"localId":"title-type","title":1,"description":""},
      {"localId":"desc-type","title":"","description":1},
      {"localId":["id-type"],"title":"","description":""},
      {"localId":"works","title":"","description":""}
    ]`
    );
    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    expect(result.current[0]).toEqual([
      { localId: 'works', title: '', description: '' },
    ]);
  });

  it('should use default value if not present', () => {
    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    expect(result.current[0]).toEqual([]);
  });

  it('should read value from local storage default value if not present', () => {
    localStorage.setItem(localStorageKey, mockTopicsString);

    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    expect(result.current[0]).toEqual([
      { localId: '0', title: 'My Title', description: 'My Description' },
    ]);
  });

  it('should update the topics', () => {
    localStorage.setItem(localStorageKey, mockTopicsString);

    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    act(() => {
      result.current[1]((prev) => [
        ...prev,
        {
          localId: '1',
          title: 'Another Title',
          description: 'Another Description',
        },
      ]);
    });

    expect(result.current[0]).toEqual([
      { localId: '0', title: 'My Title', description: 'My Description' },
      {
        localId: '1',
        title: 'Another Title',
        description: 'Another Description',
      },
    ]);
    expect(localStorage.getItem(localStorageKey)).toEqual(
      '[{"localId":"0","title":"My Title","description":"My Description"},{"localId":"1","title":"Another Title","description":"Another Description"}]'
    );
  });

  it('should validate array entries on in the setter', () => {
    localStorage.setItem(
      localStorageKey,
      `[
      {"localId":"title-type","title":1,"description":""},
      {"localId":"desc-type","title":"","description":1},
      {"localId":["id-type"],"title":"","description":""},
      {"localId":"works","title":"","description":""}
    ]`
    );
    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    const callback = jest.fn().mockImplementation((input) => input);

    act(() => {
      result.current[1](callback);
    });

    expect(callback).toBeCalledWith([
      { localId: 'works', title: '', description: '' },
    ]);
  });

  it('should react to updates in the local storage', () => {
    const { result } = renderHook(() =>
      useLocalPersonalTopics('!my-room', '@user-id')
    );

    expect(result.current[0]).toEqual([]);

    fireEvent(
      window,
      new StorageEvent('storage', {
        key: localStorageKey,
        newValue: mockTopicsString,
        storageArea: window.localStorage,
      })
    );

    expect(result.current[0]).toEqual([
      { localId: '0', title: 'My Title', description: 'My Description' },
    ]);
  });
});

describe('<PersonalTopicsContextProvider/>', () => {
  const localStorageKey = 'net.nordeck.barcamp.!room-id.%40user-id.topics';
  let widgetApi: MockedWidgetApi;
  let wrapper: ComponentType<PropsWithChildren<{}>>;

  afterEach(() => widgetApi.stop());

  beforeEach(() => {
    widgetApi = mockWidgetApi();
    wrapper = ({ children }) => {
      return (
        <WidgetApiMockProvider value={widgetApi}>
          <StoreProvider>
            <PersonalTopicsContextProvider>
              {children}
            </PersonalTopicsContextProvider>
          </StoreProvider>
        </WidgetApiMockProvider>
      );
    };
  });

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      localStorageKey,
      '[{"localId":"id0","title":"","description":""},{"localId":"id1","title":"","description":""}]'
    );
  });

  it('should provide context', () => {
    const { result } = renderHook(() => usePersonalTopics(), { wrapper });

    expect(result.current).toEqual({
      topics: [
        { localId: 'id0', title: '', description: '' },
        { localId: 'id1', title: '', description: '' },
      ],
      createTopic: expect.any(Function),
      updateTopic: expect.any(Function),
      removeTopic: expect.any(Function),
      isValidTopic: expect.any(Function),
    });
  });

  it('should skip consumed topic submissions', async () => {
    localStorage.setItem(
      localStorageKey,
      '[{"localId":"id0","title":"","description":""},{"localId":"id1","title":"","description":"","topicId":"topic-0"}]'
    );

    mockInitializeSpaceParent(widgetApi);
    widgetApi.mockSendStateEvent(
      mockSessionGrid({ content: { consumedTopicSubmissions: ['topic-0'] } })
    );

    const { result } = renderHook(() => usePersonalTopics(), { wrapper });

    await waitFor(() => {
      expect(result.current).toEqual({
        topics: [{ localId: 'id0', title: '', description: '' }],
        createTopic: expect.any(Function),
        updateTopic: expect.any(Function),
        removeTopic: expect.any(Function),
        isValidTopic: expect.any(Function),
      });
    });
  });

  it('hook should throw without context', () => {
    const { result } = renderHook(() => usePersonalTopics());

    expect(result.error?.message).toMatch(
      /usepersonaltopics must be used within a personaltopicscontextprovider/i
    );
  });

  it('should create topic', () => {
    const { result } = renderHook(() => usePersonalTopics(), { wrapper });

    expect(result.current.topics).toHaveLength(2);

    act(() => {
      result.current.createTopic();
    });

    expect(result.current.topics).toEqual([
      { localId: 'id0', title: '', description: '' },
      { localId: 'id1', title: '', description: '' },
      { localId: expect.any(String), title: '', description: '' },
    ]);
    expect(localStorage.getItem(localStorageKey)).toMatch(
      /\[{"localId":"id0","title":"","description":""},{"localId":"id1","title":"","description":""},{"localId":"[^"]+","title":"","description":""}]/
    );
  });

  it('should update topic', () => {
    const { result } = renderHook(() => usePersonalTopics(), { wrapper });

    expect(result.current.topics).toHaveLength(2);

    act(() => {
      result.current.updateTopic('id0', { title: 'A new title' });
    });

    expect(result.current.topics).toEqual([
      { localId: 'id0', title: 'A new title', description: '' },
      { localId: 'id1', title: '', description: '' },
    ]);
    expect(localStorage.getItem(localStorageKey)).toEqual(
      '[{"localId":"id0","title":"A new title","description":""},{"localId":"id1","title":"","description":""}]'
    );
  });

  it('should remove topic', () => {
    const { result } = renderHook(() => usePersonalTopics(), { wrapper });

    expect(result.current.topics).toHaveLength(2);

    act(() => {
      result.current.removeTopic('id0');
    });

    expect(result.current.topics).toEqual([
      { localId: 'id1', title: '', description: '' },
    ]);
    expect(localStorage.getItem(localStorageKey)).toEqual(
      '[{"localId":"id1","title":"","description":""}]'
    );
  });

  describe('isValidTopic', () => {
    it.each`
      input
      ${{ localId: '', title: '', description: '' }}
      ${{ localId: '', title: '1', description: '' }}
      ${{ localId: '', title: '', description: '1' }}
      ${{ localId: '', title: ''.padStart(61, '.'), description: '1' }}
      ${{ localId: '', title: '1', description: ''.padStart(141, '.') }}
    `('should reject topic $input', ({ input }) => {
      const { result } = renderHook(() => usePersonalTopics(), { wrapper });

      expect(result.current.isValidTopic(input)).toBe(false);
    });

    it.each`
      input
      ${{ localId: '', title: '1', description: '1' }}
      ${{ localId: '', title: ''.padStart(60, '.'), description: ''.padStart(140, '.') }}
    `('should accept topic $input', ({ input }) => {
      const { result } = renderHook(() => usePersonalTopics(), { wrapper });

      expect(result.current.isValidTopic(input)).toBe(true);
    });
  });
});
