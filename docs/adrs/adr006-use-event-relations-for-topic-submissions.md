# ADR006: Use event relations for topic submissions

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

The barcamp widget allows users to submit topics they want to discuss.
These topics are stored as Matrix room events that the users send into the room (see [ADR004][adr004]).

But there are limitations on the data quality that the Widget API provides for these kinds of events.
It is based on the Client's (ex: Element) local timeline, which provides all available state events (ex: tracks), but might only provide a limited window of room events (ex: submissions) of the complete room timeline.
This leads to the situation where the widget can't be sure whether all topics that are available on the homeserver are also made available by the Widget API.
[“Event Relationships”][msc2674-relationships] and [“Serverside aggregations of message relationships”][msc2675-relation-server-aggregation] are features of the Client-Server API that allows us to relate events to each other and retrieve a collection of related events from the server.
[MSC3869][msc3869-widget-api-relations] brings this feature to the Widget API and enables us to provide a reliable and deterministic way to load elements in the widget.

We want to be able to use `readEventRelations` of [MSC3869][msc3869-widget-api-relations] instead of `receiveRoomEvents` to read the topic submissions.
We accept that the described guarantees will only apply to submissions that are created after this change.
We won't upgrade existing session grids with this feature.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

1. We will emit a new `net.nordeck.barcamp.session_grid.start` event when a session grid is created:

   ```yaml
   # the type of event
   type: 'net.nordeck.barcamp.session_grid.start'

   # the room of the event
   room_id: '!my-room:…'

   # the user that created the session grid.
   sender: '@user-id'

   # the time of the event creation. we don't use it for anything yet.
   origin_server_ts: 0

   # the id of this event. it will be the target for all event relations.
   event_id: '<session-grid-start-event-id>'

   # empty content. can be extended in the future.
   content: {}
   #…
   ```

2. We will store the reference to the start event in the session grid event:

   ```diff
     type: 'net.nordeck.barcamp.session_grid'
     state_key: '!lobby-room'
     room_id: '!my-room:…'
     content:
   +   # the event_id of the start event
   +   topicStartEventId: '<session-grid-start-event-id>'
       consumedTopicSubmissions: []
       tracks: []
       timeSlots: []
       sessions: []
       parkingLots: []
       #…
   event_id: '$…'
   #…
   ```

3. We will change the topic events to relate to the start event:

   ```diff
     type: 'net.nordeck.barcamp.topic'
     state_key: '$aaaaa'
     content:
       title: 'Data Security in Chat Systems'
       description: 'How secure is our communication infrastructure? …'
       authors:
         - id: '@primary-author:matrix.to'

   +   # m.relates_to by MSC2674
   +   m.relates_to:
   +     # m.reference by MSC3267
   +     rel_type: 'm.reference'
   +
   +     # the id of the start event
   +     event_id: '<session-grid-start-event-id>'

     room_id: '!…'
     event_id: '$…'
     origin_server_ts: …
     # …
   ```

Resulting data model:

```
  ┌──────────────────────────────────────┐
  │                                      │
  │   net.nordeck.barcamp.session_grid   │
  │                                      │
  └────┬─────────────────────────────────┘
       │
       │ topicStartEventId
       │
       ▼
  ┌──────────────────────────────────────┐
  │                                      │
  │net.nordeck.barcamp.session_grid.start│
  │                                      │
  └──────────────────────────────────────┘
       ▲
       │
       │ m.relates_to: m.reference
       │
       │
       │           ┌─────────────────────────┐
       │           │                         │
       ├───────────┤net.nordeck.barcamp.topic│
       │           │                         │
       │           └─────────────────────────┘
       │
       │           ┌─────────────────────────┐
       │           │                         │
       ├───────────┤net.nordeck.barcamp.topic│
       │           │                         │
       │           └─────────────────────────┘
       │
       │           ┌─────────────────────────┐
       │           │                         │
       └───────────┤net.nordeck.barcamp.topic│
                   │                         │
                   └─────────────────────────┘
```

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

After applying the changes to the events, we need to change how we read the topics:

1. Read the session grid and extract the `topicStartEventId`.
2. Is `topicStartEventId` defined?
   - **Yes:** Fetch all events that have a `m.reference` relation to the `topicStartEventId`.
   - **No:** Fetch the events with `readRoomEvents`

### Drawbacks

> Similar drawbacks are documented in our [poll widget][poll-widget-relations-adr-consequences].

**Errors on missing events:**
When the start event could not be loaded, the topics can't be loaded.
These errors can happen when:

1. The history visibility of the room is configured so that users can't see events before they joined.
2. The Client can't decrypt some events.

We accept that this fails and rely on the the global error handling that will show an error in this case.
We already initialize the history visibility correctly during the widget setup and also already show a warning that the widget might run into trouble in encrypted rooms.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

[adr004]: ./adr004-polls-without-duration.md
[msc2674-relationships]: https://github.com/matrix-org/matrix-spec-proposals/pull/2674
[msc2675-relation-server-aggregation]: https://github.com/matrix-org/matrix-spec-proposals/pull/2675
[msc3869-widget-api-relations]: https://github.com/matrix-org/matrix-spec-proposals/pull/3869
[poll-widget-relations-adr-consequences]: https://github.com/nordeck/matrix-poll/blob/main/docs/adrs/adr005-use-event-relations-for-vote-events.md#consequences
