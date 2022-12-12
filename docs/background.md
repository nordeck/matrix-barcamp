# Overview

A BarCamp is an event with a self-organizing character.
The agenda not defined prior to the event; it is crowd-sourced by the attendees that propose and schedule topics in a planning session that takes place in the beginning of the event.
In on-site events, the planning happens on a whiteboard and/or uses Post-It notes that are put on a “grid” of sessions.
The key feature of the BarCamp widget is being a digital version of this agenda-building process that happens in a Matrix room.
It also guides the user into the individual session rooms during the day.

## Architecture

- A Barcamp Widget is used in moderated BarCamps where topics are crowd-sourced, but the grid and the placing of topics in the agenda is handled by moderators.
  Attendees can influence the placement in a video conference or via chat messages.
- There is no role differentiation between actions in the grid, i.e. either a user has a full edit/delete access, or no edit/delete access.
- Non-moderators can only submit new topics but they can not edit any content that is already in the session grid.
  This is reserved for the moderators.
- Each BarCamp is held in a dedicated Matrix space.
  All child-rooms are accessible by all participants.
- This space has a “Welcome” room that is used to manage the BarCamp.
  This room is used to draft the agenda.
  It contains a video call (e.g. Jitsi) and the BarCamp widget.
- Each space is only used for a single BarCamp that is hosted on a single day.
  Multi days could use multiple “Welcome” rooms in the same Space.
- The agenda is structured into a grid of tracks and time slots.
- Once the agenda is fixed, a (Matrix) room for each session is created and the participants can freely move into the sessions.
- Each room contains a widget that shows the agenda of all tracks, while the current track is highlighted.

## Terminology

This widget uses the following terminology.

**Track**: One of many parallel tracks that are open used to host parallel sessions. In user-facing interfaces, tracks will be communicated as “Rooms”.

**Time Slot**: A time span (09:00 — 10:00) that forms a single session in every track.

**Session**: A single time slot in a single track.

**Room**: A Matrix Room that will host a track or an individual session.

**Space**: A Matrix Space that will group different Matrix Rooms.

**Common Event**: A special kind of time slot where no sessions are planned. Instead, all participants join the same session. These can be the planning/welcome event, (coffee) breaks, social events, …

**Session Grid**: A visual representation that shows all tracks, all time slots, all sessions, and the assigned topics.

**Topic**: A content item that is the main topic of a session. A topic has a title, a description, and a submitter. Each participant can freely propose topics that will be placed into the grid.

**Parking Area**: A place where topics are collected before they are moved into the grid.

**Personal Space**: A place where participants prepare their topics before they submit it to the queue.

**Topic Queue**: Shows which participant can present and assign the next topic.

## Submission process

- A moderator decides when participants are able to submit new topics.
  This can be used to avoid unnecessarily favoring early joiners.
- Participants prepare (multiple) topics in their private space.
  Drafts are not visible to other participants.
- Participants submit topic ideas.
  Each participant can submit as many topic idea at a time.
- The order of submissions sets the order in which the topics are presented and placed into the grid.
- A moderator promotes the top item of the queue into the parking area.
  The participant briefly presents the topic and the moderator moves it into the grid.
  If the topic is not applicable (spam, too off-topic, submitter revokes a topic, …), a moderator can delete it.
- Once the topic is placed on the grid, the next item in the queue is presented.
- If a topic overlaps with a previous one, the moderator can edit an already placed topic to add any information that might be missing, if the original submitter agrees.
- A moderator can add multiple presenters to a topic that in the grid.
- A moderator can decide to move a topic to another track or time slot if necessary.
  If a topic submitter can only attend parts of the BarCamp, the moderator can “pin” a topic so it can't be moved to another time slot by mistake.

## User Roles

There are:

- Session organizer(s)
- Normal users

### Session organizer

_also known as “moderator”_

- The moderator creates a new space, creates the “welcome” room, and adds the breakout widget.
- The moderator prepares different time slots where meetings can be added to.
- The moderator prepares different tracks, but can also add/delete tracks while the topics are distributed.
- The moderator can add common events that are hosted in the welcome room (or in a dedicated room).
  These can be used for social events or other agenda items.
- The moderator can move the top topic submission from the queue to the parking area.
- The moderator can move a topic from the parking area to the session grid.
- The moderator can move a topic inside of the session grid.
- The moderator can delete a topic from the parking area and the session grid.
- The moderator can edit a topic in the session grid.
- The moderator can add an additional submitter to a topic in the session grid.
- The moderator can “pin” a topic in the session grid.

### Normal Users

_also known as “user” or “attendee” or “participant”_

- The user has a private space to prepare one or more topics.
  This space is neither shared with other devices of the user nor with other users.
- The user can add a prepared topic to the “topic queue”.
- The user can present an introduction to his topic when the moderator moves it from the queue to the parking area.
- The user can submit a new topic once the previous submission is placed into the grid.
- The user can not withdraw an item from the queue (technically he might, but the UI won't permit it).
- The user can not edit a topic after is was submitted to the queue (technically he might, but only until a moderator moves it into the grid).
- The user can not perform any mutation on session grid or the parking area.
