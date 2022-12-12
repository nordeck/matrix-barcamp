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
  createContext,
  DependencyList,
  DispatchWithoutAction,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DragDropContext, DragStart } from 'react-beautiful-dnd';
import { getNonce } from '../utils';
import { parseDroppableLocation } from './helpers';

type DragAndDropContextType = {
  isDragging: boolean;
  dragStart: DragStart | undefined;
};

type DragAndDropContextCallbacks = {
  onBeforeDragStartCallbacks: OnBeforeDragStartCallback[];
  onDragEndCallbacks: DispatchWithoutAction[];
};

type OnBeforeDragStartCallback = (
  initial: DragStart
) => void | DispatchWithoutAction;

type DragAndDropContextInternalType = DragAndDropContextType &
  DragAndDropContextCallbacks;

export const DragAndDropContext = createContext<
  DragAndDropContextInternalType | undefined
>(undefined);

export function useDragAndDropContext(
  onBeforeDragStart?: OnBeforeDragStartCallback,
  deps?: DependencyList
): DragAndDropContextType {
  const context = useContext(DragAndDropContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onBeforeDragStartCallback = useCallback(
    onBeforeDragStart ?? (() => {}),
    deps ?? []
  );
  useEffect(() => {
    if (context) {
      context.onBeforeDragStartCallbacks.push(onBeforeDragStartCallback);

      return () => {
        const index = context.onBeforeDragStartCallbacks.indexOf(
          onBeforeDragStartCallback
        );
        context.onBeforeDragStartCallbacks.splice(index, 1);
      };
    }
  }, [context, onBeforeDragStartCallback]);

  if (context === undefined) {
    throw new Error(
      'useDragAndDropState must be used within a DragAndDropProvider'
    );
  }

  return context;
}

export function DragAndDropProvider({
  children,
  onMoveTopicToParkingArea,
  onMoveTopicToSession,
  onMoveTimeSlot,
}: PropsWithChildren<{
  onMoveTopicToParkingArea?: (topicId: string, toIndex: number) => void;
  onMoveTopicToSession?: (
    topicId: string,
    timeSlotId: string,
    trackId: string
  ) => void;
  onMoveTimeSlot?: (timeSlotId: string, toIndex: number) => void;
}>) {
  const [value, setValue] = useState<DragAndDropContextType>({
    isDragging: false,
    dragStart: undefined,
  });
  const callbacksRef = useRef<DragAndDropContextCallbacks>({
    onBeforeDragStartCallbacks: [],
    onDragEndCallbacks: [],
  });

  return (
    <DragDropContext
      onBeforeDragStart={(dragStart) => {
        callbacksRef.current.onBeforeDragStartCallbacks.forEach((c) => {
          const onDragEndCallback = c(dragStart);
          if (onDragEndCallback) {
            callbacksRef.current.onDragEndCallbacks.push(onDragEndCallback);
          }
        });
      }}
      onDragStart={(dragStart) => setValue({ isDragging: true, dragStart })}
      onDragEnd={(result) => {
        if (result.type === 'topic' && result.destination) {
          const topicId = result.draggableId;
          const destination = parseDroppableLocation(result.destination);

          if (destination.type === 'parkingLot' && onMoveTopicToParkingArea) {
            onMoveTopicToParkingArea(topicId, destination.index);
          } else if (destination.type === 'session' && onMoveTopicToSession) {
            onMoveTopicToSession(
              topicId,
              destination.timeSlotId,
              destination.trackId
            );
          }
        } else if (
          result.type === 'timeSlot' &&
          result.destination &&
          onMoveTimeSlot
        ) {
          const timeSlotId = result.draggableId;
          onMoveTimeSlot(timeSlotId, result.destination.index);
        }

        callbacksRef.current.onDragEndCallbacks.forEach((c) => c());
        callbacksRef.current.onDragEndCallbacks.length = 0;

        setValue({ isDragging: false, dragStart: undefined });
      }}
      // Required as we don't have unsafe-inline enabled
      nonce={getNonce()}
    >
      <DragAndDropContext.Provider
        value={{ ...value, ...callbacksRef.current }}
      >
        {children}
      </DragAndDropContext.Provider>
    </DragDropContext>
  );
}
