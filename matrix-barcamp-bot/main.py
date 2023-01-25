#!/usr/bin/env python

#  Copyright (c) 2023 Nordeck IT + Consulting GmbH
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and  limitations
#  under the License.

import simplematrixbotlib as botlib
import nio
from typing import Union
from dataclasses import dataclass
import sys


@dataclass
class MyConfig(botlib.Config):
    _homeserver: str = ""
    _username: str = ""
    _password: str = ""
    _session_stored_file: str = "session.txt"

    @property
    def session_stored_file(self) -> str:
        return self._session_stored_file

    @session_stored_file.setter
    def session_stored_file(self, value: str) -> None:
        self._session_stored_file = value

    @property
    def homeserver(self) -> str:
        return self._homeserver

    @homeserver.setter
    def homeserver(self, value: str) -> None:
        self._homeserver = value

    @property
    def username(self) -> str:
        return self._username

    @username.setter
    def username(self, value: str) -> None:
        self._username = value

    @property
    def password(self) -> str:
        return self._password

    @password.setter
    def password(self, value: str) -> None:
        self._password = value


config = MyConfig()
config.load_toml('config.toml')
# enforce these settings regardless of config
config.encryption_enabled = False  # barcamp widget isn't encrypted
config.ignore_unverified_devices = True  # TOFU

creds = botlib.Creds(
    homeserver=config.homeserver,
    username=config.username,
    password=config.password,
    session_stored_file=config.session_stored_file
    )
bot = botlib.Bot(creds, config)

PREFIX = '!'
TOPIC_SUBMISSION_TYPE = "net.nordeck.barcamp.topic_submission"


async def send_reaction(room_id, message, key: str):
    await bot.api._send_room(
        room_id=room_id,
        content={
            "m.relates_to": {
                "event_id": message.event_id,
                "key": key,
                "rel_type": "m.annotation"
            }
        },
        message_type="m.reaction"
    )


async def get_session_grid_start_id(room_id: str) -> Union[str, None]:
    res = await bot.async_client.room_get_state_event(
        room_id=room_id,
        event_type="net.nordeck.barcamp.session_grid",
        state_key=room_id
    )

    if not isinstance(res, nio.responses.RoomGetStateEventResponse):
        await bot.api.send_markdown_message(
            room_id=room_id,
            message="could not find `net.nordeck.barcamp.session_grid` state event",
            msgtype="m.notice"
        )
        return None

    session_grid_start_id = res.content.get("topicStartEventId")

    if session_grid_start_id is None:
        await bot.api.send_markdown_message(
            room_id=room_id,
            message="could not find `topicStartEventId` in `net.nordeck.barcamp.session_grid` state event",
            msgtype="m.notice"
        )

    return session_grid_start_id


@bot.listener.on_message_event
async def submit(room, message):
    match = botlib.MessageMatch(room, message, bot, PREFIX)

    if match.is_not_from_this_bot() and match.prefix() and match.command("submit"):
        try:
            submission = match.event.body.split(maxsplit=1)[1]
            submission = submission.split(':', 1)

            # invalid input
            if len(submission) < 2:
                await send_reaction(room.room_id, message, "❌")
                return

            # parse the submission
            title, description = submission
            title = title.strip()
            description = description.strip()

            # get the topicStartEventId https://github.com/nordeck/matrix-barcamp/pull/57
            session_grid_start_id = await get_session_grid_start_id(room.room_id)
            if session_grid_start_id is None:
                return

            # are submissions still locked?
            locked = room.power_levels.can_user_send_message(bot.async_client.user_id, event_type=TOPIC_SUBMISSION_TYPE)
            if not locked:
                await send_reaction(room.room_id, message, "🔒️")
                return

            # send the "translated" event to the barcamp widget
            await bot.api._send_room(
                room_id=room.room_id,
                content={
                    "title": title,
                    "description": description,
                    "author": message.sender,
                    "m.relates_to": {
                        "event_id": session_grid_start_id,
                        "rel_type": "m.reference"
                    }
                },
                message_type=TOPIC_SUBMISSION_TYPE
            )

            # send a checkmark reaction to notify the user
            await send_reaction(room.room_id, message, "✅")

        except KeyboardInterrupt as e:
            raise e

        except Exception:
            await send_reaction(room.room_id, message, "❌")


@bot.listener.on_message_event
async def help_message(room, message):
    match = botlib.MessageMatch(room, message, bot, PREFIX)

    if match.is_not_from_this_bot() and match.prefix() and match.command("help"):
        await bot.api.send_markdown_message(
            room.room_id,
            "Hi, I'm matrix-barcamp-bot! Suggest a topic by writing `!submit <title>: <description>`.\n"
            "I will react with these emoji:\n"
            "- ✅ if your submission was handled\n"
            "- ❌ if there was an error (please notify you local admin)\n"
            "- 🔒 if submissions are locked and you may not submit",
            msgtype="m.notice"
        )

        # send a checkmark reaction to notify the user
        await send_reaction(room.room_id, message, "✅")


if __name__ == '__main__':
    try:
        bot.run()
    except KeyboardInterrupt:
        print("Received keyboard interrupt.")
        sys.exit(0)
