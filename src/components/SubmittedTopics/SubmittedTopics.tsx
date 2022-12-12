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

import { first } from 'lodash';
import { useTranslation } from 'react-i18next';
import { Header, Icon, Segment } from 'semantic-ui-react';
import {
  useAvailableTopicSubmissions,
  usePowerLevels,
  useSpaceMembers,
} from '../../store';
import { ButtonWithIcon } from '../ButtonWithIcon';
import { styled } from '../StyledComponentsThemeProvider';
import { Tooltip } from '../Tooltip';

const SubmissionList = styled.ol({
  paddingLeft: '1.75em',
});

const PiledSegment = styled(Segment)({
  '&&&&&': {
    zIndex: 1,
    margin: '1rem 0em',
  },
});

const PlaceholderSegment = styled(Segment)({
  '&&&&&': {
    minHeight: 0,
    margin: '1rem 0em',
  },
});

const TextOverflow = styled.div({
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
});

const TooltipContainer = styled.div({
  maxWidth: 194,
});

const ParagraphWithHyphens = styled.p({
  hyphens: 'auto',
});

type SubmittedTopicsProps = {
  onSelectNextTopic: () => void;
};

export function SubmittedTopics({ onSelectNextTopic }: SubmittedTopicsProps) {
  const { t } = useTranslation();
  const { canModerate } = usePowerLevels();
  const { data: topics = [] } = useAvailableTopicSubmissions();

  // TODO: Error handling!

  const firstTopic = first(topics);
  const { lookupDisplayName } = useSpaceMembers();

  if (!firstTopic) {
    return (
      <PlaceholderSegment placeholder attached>
        {t(
          'submittedTopics.placeholder',
          'No suggestions. Be the first one to suggest a topic.'
        )}
      </PlaceholderSegment>
    );
  }

  return (
    <Tooltip
      content={
        <TooltipContainer>
          <Header as="h5">
            {t('submittedTopics.tooltip.title', 'Topic suggestions')}
          </Header>
          <p>
            {t(
              'submittedTopics.tooltip.description',
              'The next suggestions are from:'
            )}
          </p>
          <SubmissionList>
            {topics.map((s) => (
              <li key={s.event_id}>
                <TextOverflow>{lookupDisplayName(s.sender)}</TextOverflow>
                <TextOverflow>{s.content.title}</TextOverflow>
              </li>
            ))}
          </SubmissionList>
        </TooltipContainer>
      }
    >
      <div>
        <PiledSegment attached piled={topics.length > 1}>
          <ParagraphWithHyphens>
            {topics.length > 1
              ? t(
                  'submittedTopics.summary.multiple',
                  'Suggestions from {{author}} and {{count}} more…',
                  {
                    author: lookupDisplayName(firstTopic.sender),
                    count: topics.length - 1,
                  }
                )
              : t(
                  'submittedTopics.summary.single',
                  'Suggestion from {{author}}',
                  {
                    author: lookupDisplayName(firstTopic.sender),
                  }
                )}
          </ParagraphWithHyphens>

          {canModerate && (
            <ButtonWithIcon fluid onClick={onSelectNextTopic} basic positive>
              <Icon name="sticky note" />
              {t('submittedTopics.selectNext', 'Select next topic')}
            </ButtonWithIcon>
          )}
        </PiledSegment>
      </div>
    </Tooltip>
  );
}
