from threading import RLock
from typing import Optional, Iterator, Dict, List

import sys
from itertools import cycle

import chube_youtube
from channel import Channel, Subscriber
from chube_enums import *
from chube_ws import Resolver, Message, start_server, make_message


class Chueue:
    _lock: RLock
    _queue: List[int]
    _codes: Dict[int, str]
    _id_iter: Iterator[int]

    _played_queue: Optional[List[int]]
    _repeat_enabled: bool = False

    def __init__(self):
        self._lock = RLock()
        self._queue = []
        self._codes = dict()
        self._id_iter = cycle(range(sys.maxsize))
        self._played_queue = None

    def add(self, code):
        with self:
            song_id = next(self._id_iter)
            self._queue.append(song_id)
            self._codes[song_id] = code
        return song_id

    def remove(self, song_id):
        with self:
            self._queue.remove(song_id)
            self._codes.pop(song_id)

    def move(self, song_id, displacement):
        with self:
            i = self._queue.index(song_id)
            new_i = min(len(self._queue) - 1, max(0, i + displacement))
            self._queue.pop(i)
            self._queue.insert(new_i, song_id)
            return new_i - i

    def pop(self):
        with self:
            if len(self._queue) <= 0:
                if self._repeat_enabled and len(self._played_queue) > 0:
                    self._queue = self._played_queue
                    self._played_queue = []
                else:
                    return None
                
            song_id = self._queue.pop(0)
            if self._repeat_enabled:
                code = self._codes[song_id]
                self._played_queue.append(song_id)
            else:
                code = self._codes.pop(song_id)
            return self.as_song(song_id, code)

    def set_repeat_enabled(self, enable, playback_song):
        self._repeat_enabled = enable
        if enable:
            if playback_song is not None:
                self._played_queue = [playback_song["id"]]
                self._codes[playback_song["id"]] = playback_song["code"]
            else:
                self._played_queue = []
        else:
            self._played_queue = None

    def is_repeat_enabled(self):
        return self._repeat_enabled

    def as_song(self, song_id, code=None):
        if code is None:
            code = self._codes[song_id]
        return {"id": song_id, "code": code}

    def as_lists(self):
        with self:
            queue_as_list = list(map(self.as_song, self._queue))
            played_as_list = list(map(self.as_song, self._played_queue)) if self.is_repeat_enabled() else None
            return {"next": queue_as_list, "previous": played_as_list}

    def lock(self):
        self._lock.acquire()

    def unlock(self):
        self._lock.release()

    def __enter__(self):
        self.lock()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.unlock()

    def __len__(self):
        return len(self._queue)


class Playback:
    _song: Optional[Dict] = None
    _state: PlayerState = PlayerState.LIST_END
    lock: RLock()

    def __init__(self):
        self.lock = RLock()

    def set_song(self, song):
        with self.lock:
            self._song = song

    def get_song(self):
        with self.lock:
            return self._song

    def get_song_id(self):
        with self.lock:
            if self._song is not None:
                return self._song["id"]
            else:
                return None

    def get_state(self):
        return self._state

    def set_state(self, state):
        self._state = state


class Room:
    chueue: Chueue
    channel: Channel
    controller: Optional[Subscriber]
    controller_lock: RLock
    playback: Playback

    def __init__(self):
        self.chueue = Chueue()
        self.channel = Channel()
        self.controller_lock = RLock()
        self.playback = Playback()
        self.controller = None


rooms: Dict[str, Room] = dict()


async def request_state_processor(ws, data, path):
    room = rooms[path]
    await ws.send(make_message(Message.STATE, {
        "lists": room.chueue.as_lists(),
        "playing": room.playback.get_song(),
        "state": room.playback.get_state().value
    }))


async def request_list_operation_processor(ws, data, path):
    room = rooms[path]
    chueue = room.chueue
    op = data["op"]
    message = None
    if op == QueueOp.ADD.value:
        kind = data["kind"]
        if kind == YoutubeResourceType.VIDEO.value:
            code = data["code"]
            song_id = chueue.add(code)
            message = make_message(Message.LIST_OPERATION,
                                   {"op": QueueOp.ADD.value, "items": [{"code": code, "id": song_id}]})
        elif kind == YoutubeResourceType.PLAYLIST.value:
            code = data["code"]
            playlist_items = await chube_youtube.get_all_playlist_items(code)
            response_items = []
            with room.chueue:
                for item in playlist_items["items"]:
                    code = item["snippet"]["resourceId"]["videoId"]
                    song_id = chueue.add(code)
                    response_items.append({"code": code, "id": song_id, "snippet": item["snippet"]})
            message = make_message(Message.LIST_OPERATION, {"op": QueueOp.ADD.value, "items": response_items})
        with room.playback.lock:
            if room.playback.get_state() == PlayerState.LIST_END:
                playing = chueue.pop()
                if playing is not None:
                    room.playback.set_state(PlayerState.PLAYING)
                    room.playback.set_song(playing)
    elif op == QueueOp.DEL.value:
        song_id = data["id"]
        chueue.remove(song_id)
        message = make_message(Message.LIST_OPERATION, {"op": QueueOp.DEL.value, "items": [{"id": song_id}]})
    elif op == QueueOp.MOVE.value:
        song_id = data["id"]
        displacement = data["displacement"]
        actual_displacement = chueue.move(song_id, displacement)
        if actual_displacement != 0:
            message = make_message(Message.LIST_OPERATION,
                                   {"op": QueueOp.MOVE.value,
                                    "items": [{"id": song_id, "displacement": actual_displacement}]})

    if message is not None:
        await room.channel.send(message)


async def media_action_processor(ws, data, path):
    room = rooms[path]
    action = data["action"]
    send_next = False
    if action == MediaAction.NEXT.value:
        current_id = data["current_id"]
        with room.playback.lock, room.chueue:
            old_song_id = room.playback.get_song_id()
            if old_song_id == current_id:
                send_next = True
                new_song = play_next_song(room)
                if new_song is None:
                    new_song_id = None
                else:
                    new_song_id = new_song["id"]
        if send_next:
            await room.channel.send(make_message(
                Message.MEDIA_ACTION,
                {"action": MediaAction.NEXT.value, "ended_id": old_song_id, "current_id": new_song_id}))

    if action == MediaAction.PLAY.value or send_next:
        send_play = False
        with room.playback.lock:
            if room.playback.get_state() == PlayerState.PAUSED:
                send_play = True
                room.playback.set_state(PlayerState.PLAYING)
        if send_play:
            await room.channel.send(make_message(Message.MEDIA_ACTION, {"action": MediaAction.PLAY.value}))

    if action == MediaAction.PAUSE.value:
        send_pause = False
        with room.playback.lock:
            if room.playback.get_state() == PlayerState.PLAYING:
                send_pause = True
                room.playback.set_state(PlayerState.PAUSED)
        if send_pause:
            await room.channel.send(make_message(Message.MEDIA_ACTION, {"action": MediaAction.PAUSE.value}))

    if action == MediaAction.REPEAT.value:
        enable = data["enable"]
        if room.chueue.is_repeat_enabled() != enable:
            with room.chueue:
                room.chueue.set_repeat_enabled(enable, room.playback.get_song())
            await room.channel.send(make_message(Message.MEDIA_ACTION, {"action": MediaAction.REPEAT.value, "enable": enable}))


async def obtain_control_processor(ws, data, path):
    room = rooms[path]
    await obtain_control(ws, room)


async def release_control_processor(ws, data, path):
    room = rooms[path]
    if len(room.channel.subscribers) > 1:
        await release_control(ws, room)
    else:
        pass
        # TODO error here


def play_next_song(room):
    new_song = room.chueue.pop()
    room.playback.set_song(new_song)
    if new_song is None:
        room.playback.set_state(PlayerState.LIST_END)
    return new_song


async def song_end_processor(ws, data, path):
    room = rooms[path]
    old_song_id = data["id"]
    with room.controller_lock, room.playback.lock:
        if room.controller is not None and ws is room.controller.ws and old_song_id == room.playback.get_song_id():
            new_song = play_next_song(room)
            if new_song is None:
                new_song_id = None
            else:
                new_song_id = new_song["id"]
            await room.channel.send(
                make_message(Message.SONG_END, {"ended_id": old_song_id, "current_id": new_song_id}))


async def player_enabled_processor(ws, data, path):
    room = rooms[path]
    room.channel.subscribers[ws].player_enabled = data["enabled"]
    if data["enabled"]:
        with room.controller_lock:
            if room.controller is None:
                await obtain_control(ws, room)
    else:
        await release_control(ws, room)


# TODO There is some potential concurrent bug here, when the controller loses/releases control right before a song end.
async def obtain_control(ws, room: Room):
    with room.controller_lock:
        if room.controller is None or room.controller.ws is not ws:
            prev_controller = room.controller
            room.controller = room.channel.subscribers[ws]
            await ws.send(make_message(Message.OBTAIN_CONTROL))
            if prev_controller is not None:
                await prev_controller.ws.send(make_message(Message.RELEASE_CONTROL))


async def release_control(ws, room: Room):
    with room.controller_lock:
        if room.controller is not None and room.controller.ws is ws:
            room.controller = next(room.channel.get_player_enabled_subscribers(), None)
            if room.controller is not None:
                await room.controller.ws.send(make_message(Message.OBTAIN_CONTROL))
            await ws.send(make_message(Message.RELEASE_CONTROL))


async def on_connect(ws, path):
    if path not in rooms:
        rooms[path] = Room()
    room = rooms[path]
    room.channel.subscribe(ws)


async def on_disconnect(ws, path):
    room = rooms[path]
    room.channel.unsubscribe(ws)
    await release_control(ws, room)
    # with room.controller_lock:
    #     if room.controller is None:
    #         room.playback.


def make_resolver():
    resolver = Resolver()
    resolver.register(Message.STATE, request_state_processor)
    resolver.register(Message.LIST_OPERATION, request_list_operation_processor)
    resolver.register(Message.MEDIA_ACTION, media_action_processor)
    resolver.register(Message.PLAYER_ENABLED, player_enabled_processor)
    resolver.register(Message.OBTAIN_CONTROL, obtain_control_processor)
    resolver.register(Message.RELEASE_CONTROL, release_control_processor)
    resolver.register(Message.SONG_END, song_end_processor)

    search_resolver = chube_youtube.make_resolver()

    resolver.add_all(search_resolver)

    return resolver


def init_rooms():
    # rooms["main"] = Room()
    pass


if __name__ == "__main__":
    player_resolver = make_resolver()

    init_rooms()

    start_server(player_resolver, on_connect, on_disconnect)
