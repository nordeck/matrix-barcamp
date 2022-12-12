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

import { useRef } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { useScroll } from 'react-use';
import { Session, TimeSlot, Track } from '../../lib/events';
import {
  useAddTimeSlotMutation,
  useAddTrackMutation,
  useDeleteTimeSlotMutation,
  useDeleteTopicMutation,
  useDeleteTrackMutation,
  usePowerLevels,
  useUpdateCommonEventMutation,
  useUpdateTimeSlotMutation,
  useUpdateTopicMutation,
  useUpdateTrackMutation,
} from '../../store';
import {
  stringifyDroppableId,
  useDragAndDropContext,
} from '../DragAndDropProvider';
import { styled } from '../StyledComponentsThemeProvider';
import { AddTimeSlotButton } from './AddTimeSlotButton';
import { AddTrackButton } from './AddTrackButton';
import { EditModeGuard, EditModeProvider } from './EditModeContext';
import { EditModeSwitcher } from './EditModeSwitcher';
import { EndTimeRow } from './EndTimeRow';
import { TimeSlotRow } from './TimeSlotRow';
import { TrackTitle } from './TrackTitle';

const ScrollContainer = styled.div(({ theme }) => ({
  overflow: 'auto',
  height: '100%',
  background: theme.pageBackgroundModal,
}));

const ScrollWrapper = styled.div({
  display: 'flex',
  alignItems: 'flex-start',
});

const TableContainer = styled.table<{
  trackCount: number;
  horizontalElevated: boolean;
  verticalElevated: boolean;
  canDropSession?: boolean;
}>(
  ({
    trackCount,
    horizontalElevated,
    verticalElevated,
    canDropSession,
    theme,
  }) => ({
    borderSpacing: 0,
    background: canDropSession
      ? `repeating-linear-gradient(45deg, ${theme.pageBackground}, ${theme.pageBackground} 10px, transparent 10px, transparent 20px)`
      : undefined,

    // set the styles on all heading elements
    th: {
      fontWeight: 'inherit',
      textAlign: 'left',
      backgroundColor: theme.pageBackground,
      transition:
        verticalElevated || horizontalElevated
          ? 'box-shadow 0.25s ease-in-out, z-index 0.25s step-start'
          : 'box-shadow 0.25s ease-in-out, z-index 0.25s step-end',
    },

    // all sessions should have a minimal height and width
    'td.session': {
      minWidth: 200,
      width: `${100 / trackCount}%`,
      minHeight: 200,
      height: 200,
    },

    // set the default borders, padding, and alignment for all cells
    'td, th': {
      boxSizing: 'border-box',
      padding: 8,
      verticalAlign: 'top',

      '&:not(.create)': {
        borderRight: `1px solid ${theme.borderColor}`,
        borderBottom: `1px solid ${theme.borderColor}`,
      },
    },

    'td.create, th.create': {
      backgroundColor: theme.pageBackgroundModal,
    },

    // Display a shadow under the top table header.
    'thead th': {
      '&:not(.create)': {
        boxShadow: verticalElevated
          ? `1px 1px 2px 0 ${theme.borderColor}`
          : undefined,
      },

      position: 'sticky',
      top: 0,
      zIndex: verticalElevated ? 30 : 20,
      verticalAlign: 'middle',
    },

    // Display a shadow under the left side table header.
    'th:first-child': {
      '&:not(.create)': {
        boxShadow: horizontalElevated
          ? `1px 1px 2px 0 ${theme.borderColor}`
          : undefined,
      },

      position: 'sticky',
      left: 0,
      zIndex: horizontalElevated ? 30 : 20,
    },

    // The top left cell should stay on top of all
    // if scrolled in both directions.
    'thead th:first-child': {
      zIndex: (verticalElevated ? 20 : 10) + (horizontalElevated ? 20 : 10),
    },
  })
);

export type SessionGridProps = {
  tracks: Track[];
  timeSlots: TimeSlot[];
  sessions: Session[];
};

export function SessionGrid({ tracks, timeSlots, sessions }: SessionGridProps) {
  const { t } = useTranslation();
  const { canModerate } = usePowerLevels();
  const [addTrack] = useAddTrackMutation();
  const [deleteTrack] = useDeleteTrackMutation();
  const [updateTrack] = useUpdateTrackMutation();
  const [addTimeSlot] = useAddTimeSlotMutation();
  const [updateCommonEvent] = useUpdateCommonEventMutation();
  const [updateTimeSlot] = useUpdateTimeSlotMutation();
  const [deleteTopic] = useDeleteTopicMutation();
  const [deleteTimeSlot] = useDeleteTimeSlotMutation();
  const [updateTopic] = useUpdateTopicMutation();

  const ref = useRef<HTMLTableElement>(null);
  const { dragStart } = useDragAndDropContext(() => {
    const element = ref.current;

    if (element) {
      // For reordering of table rows to work properly, we need to lock the
      // dimensions of the cells in the grid. Otherwise the sizes will change
      // while the row is dragged, resulting in an ugly look.
      // For more details, see: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/patterns/tables.md#strategy-2-dimension-locking
      element
        .querySelectorAll<HTMLElement>('td, th')
        .forEach(
          (e) => (e.style.width = `${e.getBoundingClientRect().width}px`)
        );

      return () =>
        element
          .querySelectorAll<HTMLElement>('td, th')
          .forEach((e) => (e.style.width = ''));
    }
  }, [ref]);
  const canDropSession = dragStart?.type === 'topic';
  const scrollContainerRef = useRef(null);
  const { x, y } = useScroll(scrollContainerRef);
  const hasHorizontalScroll = x !== 0;
  const hasVerticalScroll = y !== 0;
  const canDeleteTimeSlot = timeSlots.length > 1;
  const canDeleteTrack = tracks.length > 1;

  return (
    <EditModeProvider enableEdit={!canModerate ? false : undefined}>
      <ScrollContainer ref={scrollContainerRef}>
        <ScrollWrapper>
          <TableContainer
            ref={ref}
            trackCount={tracks.length}
            canDropSession={canDropSession}
            horizontalElevated={hasHorizontalScroll}
            verticalElevated={hasVerticalScroll}
            aria-label={t('sessionGrid.title', 'Session Grid')}
          >
            <thead>
              <tr aria-label={t('sessionGrid.tracks', 'Tracks')}>
                {/* Top left corner is empty */}
                <th>
                  {/* This is only a temporary location for the edit mode 
                      switch it migth be best suited in the sidebar later on */}
                  {canModerate && <EditModeSwitcher />}
                </th>

                {/* All track headers */}
                {tracks.map((t, i) => (
                  <TrackTitle
                    key={t.id}
                    track={t}
                    onChange={(trackId, changes) =>
                      updateTrack({ trackId, changes })
                    }
                    onDelete={
                      canDeleteTrack
                        ? () => deleteTrack({ trackId: t.id })
                        : undefined
                    }
                  />
                ))}

                <EditModeGuard>
                  <th className="create">
                    <AddTrackButton onAddTrack={addTrack} />
                  </th>
                </EditModeGuard>
              </tr>
            </thead>

            <Droppable
              type="timeSlot"
              droppableId={stringifyDroppableId({ type: 'timeSlot' })}
            >
              {(provided) => (
                <tbody {...provided.droppableProps} ref={provided.innerRef}>
                  {/* Time slots with sessions */}
                  {timeSlots.map((s, i) => (
                    <TimeSlotRow
                      key={s.id}
                      index={i}
                      timeSlot={s}
                      tracks={tracks}
                      sessions={sessions}
                      onCommonEventChange={(timeSlotId, changes) =>
                        updateCommonEvent({ timeSlotId, changes })
                      }
                      onTopicChange={(topicId, changes) =>
                        updateTopic({ topicId, changes })
                      }
                      onDelete={
                        canDeleteTimeSlot
                          ? () => deleteTimeSlot({ timeSlotId: s.id })
                          : undefined
                      }
                      onDeleteTopic={(topicId) => deleteTopic({ topicId })}
                      onTimeSlotChange={(timeSlotId, changes) =>
                        updateTimeSlot({ timeSlotId, changes })
                      }
                    >
                      {i === 0 && (
                        <EditModeGuard>
                          <td
                            aria-hidden
                            className="create"
                            rowSpan={timeSlots.length}
                          />
                        </EditModeGuard>
                      )}
                    </TimeSlotRow>
                  ))}

                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>

            {/* Last row with the end time */}
            <tfoot>
              <EndTimeRow timeSlots={timeSlots} tracks={tracks} />
              <EditModeGuard>
                <tr>
                  <th className="create">
                    <AddTimeSlotButton
                      onAddTimeSlot={(timeSlotType) =>
                        addTimeSlot({ timeSlotType })
                      }
                    />
                  </th>
                  <td className="create" colSpan={tracks.length + 1}></td>
                </tr>
              </EditModeGuard>
            </tfoot>
          </TableContainer>
        </ScrollWrapper>
      </ScrollContainer>
    </EditModeProvider>
  );
}
