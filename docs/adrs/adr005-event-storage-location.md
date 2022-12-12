# ADR005: Storage Location of Matrix Events

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

Online BarCamps that are organized with this BarCamp platform are taking place in a Matrix Space ([ADR003][adr003]) and use Matrix events to store the state ([ADR004][adr004]).
In order to make make it work, we need to decide in which of the Matrix rooms in the BarCamp space we want to store the Matrix events.

Different data needs to be accessible from different locations:

1. Topic Suggestions:
   They are used during the planning process and are only needed in the planning room.
2. Session Grid (tracks, time slots, assigned topics):
   They are created and updated from the planning room.
   Every room needs to access the data to show a local agenda.
3. Room mapping:
   They are created and updated from the planning room.
   Every room needs to access the data to know the assignment to a topic.

Some relevant properties of the Widget API:

1. Each event belongs to a single room.
2. Spaces are rooms with a special type.
3. A widget must ask the user for permission to read or write events in a room ([MSC2762][msc2762-widgets-spec]).
4. The permissions negotiation is done on widget initialization.
   A widget could renegotiate the permissions during runtime, but this feature is not usable due to open issues ([MSC2974][msc2974-renegotiate], [`matrix-widget-api#52`](https://github.com/matrix-org/matrix-widget-api/issues/52), [`matrix-react-sdk#7454`](https://github.com/matrix-org/matrix-react-sdk/pull/7454)).
5. A widget can expand all permissions to a list of rooms, or all rooms a user joined ([MSC2762][msc2762-widgets-spec]).
6. A widget can only interact with rooms that a user has already joined ([MSC2762][msc2762-widgets-spec]).
7. A widget can only access the newest _state event_ for each `state_key` ([MSC2762][msc2762-widgets-spec]).
8. There is no guarantee that a widget receives all _room events_ in the timeline ([MSC2762][msc2762-widgets-spec]).
   The Matrix client can only provide timeline data that is loaded from the Matrix Server, which might be incomplete.
   There is no backfill so the widget must be reloaded to receive older data that the client fetched in the background.
9. Additional parameters can be provided to the widget in the URL that is stored in the widget state event (by default: user name, room id, …) ([MSC2764][msc2764-widget-book]).

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will store the state events in the space room because they must be readable from every room in the space:

- `net.nordeck.barcamp.linked_room`
- `net.nordeck.barcamp.session_grid`
- `net.nordeck.barcamp.topic`

We will store the room events in the lobby room because they only need to be accessible in the planning session:

- `net.nordeck.barcamp.topic_submission`

We expect that every user joined the space.

We will also use the `m.room.member` events of the space room.
The `m.room.power_levels` event will be considered according to the location of the event.

### Alternative: State in the lobby room

We could also store all the state in the lobby room.
But we can't guarantee that every user has joined the lobby room.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

### Determine the event location

Find the space that stores the events with the following algorithm:

- The room that is listed in the `m.space.parent` of the room with `canonical === true`.
- If the listed room has a `m.room.create` event with `type === 'space'`.
- If the listed space has a `m.space.child` event that links back to the original room.

### Determine the room type

1. Is there a `net.nordeck.barcamp.session_grid` with the `state_key === <own_room_id>`? → lobby room
2. Is there a `net.nordeck.barcamp.linked_room` with the `state_key === <own_room_id>`? → A topic room
3. Else → show welcome screen.

### Capabilities

In order to display the grid, the widget must be able to read the data.
Since the capability renegotiation is unstable, we opt to request all required capabilities for everyone in all rooms.
We also aren't aware of the space that stores the data without reading the `m.space.parent` event.

This includes:

- `m.room.members`: read
- `m.room.power_levels`: read
- `m.room.name`: read, write
- `m.room.topic`: read, write
- `m.room.create`: read
- `m.space.child`: read
- `m.space.parent`: read
- `net.nordeck.barcamp.linked_room`: read, write
- `net.nordeck.barcamp.session_grid`: read, write
- `net.nordeck.barcamp.topic`: read, write
- `net.nordeck.barcamp.topic_submission`: read, write
- `im.vector.modular.widgets`: read, write

> **Access space room**
>
> When working with spaces, it's often helpful to access the room of the space. To do that, enable the "Developer mode" lab option in the settings. Afterwards you can click "See room timeline (devtools) on the space menu.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->

[adr003]: ./adr003-space-structure.md
[adr004]: ./adr004-structure-of-matrix-events.md
[msc2762-widgets-spec]: https://github.com/matrix-org/matrix-spec-proposals/pull/2762
[msc2764-widget-book]: https://github.com/matrix-org/matrix-spec-proposals/pull/2764
[msc2974-renegotiate]: https://github.com/matrix-org/matrix-spec-proposals/pull/2974
