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
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import { StickyNote2 as NoteIcon } from '@mui/icons-material';
import {
  useAvailableTopicSubmissions,
  usePowerLevels,
  useSpaceMembers,
} from '../../store';
import { Tooltip } from '../Tooltip';

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
      <Alert severity="info" sx={{ my: 2 }}>
        {t(
          'submittedTopics.placeholder',
          'No suggestions. Be the first one to suggest a topic.'
        )}
      </Alert>
    );
  }

  const tooltipContent = (
    <Box sx={{ maxWidth: 194 }}>
      <Typography variant="h6" gutterBottom>
        {t('submittedTopics.tooltip.title', 'Topic suggestions')}
      </Typography>
      <Typography variant="body2" paragraph>
        {t(
          'submittedTopics.tooltip.description',
          'The next suggestions are from:'
        )}
      </Typography>
      <List dense>
        {topics.map((s) => (
          <ListItem key={s.event_id} disablePadding>
            <ListItemText
              primary={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden' 
                  }}
                >
                  {lookupDisplayName(s.sender)}
                </Typography>
              }
              secondary={
                <Typography 
                  variant="caption" 
                  sx={{ 
                    whiteSpace: 'nowrap', 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden' 
                  }}
                >
                  {s.content.title}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Tooltip content={tooltipContent}>
      <Card 
        sx={{ 
          my: 2,
          position: 'relative',
          zIndex: topics.length > 1 ? 2 : 1,
          '&::before': topics.length > 1 ? {
            content: '""',
            position: 'absolute',
            top: -4,
            left: 4,
            right: -4,
            bottom: 4,
            backgroundColor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            zIndex: -1,
          } : undefined
        }}
      >
        <CardContent>
          <Typography 
            variant="body2" 
            paragraph 
            sx={{ 
              hyphens: 'auto',
              wordBreak: 'break-word'
            }}
          >
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
          </Typography>

          {canModerate && (
            <Button 
              fullWidth 
              variant="outlined" 
              color="success"
              onClick={onSelectNextTopic}
              startIcon={<NoteIcon />}
            >
              {t('submittedTopics.selectNext', 'Select next topic')}
            </Button>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
}
