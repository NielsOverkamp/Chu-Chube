from enum import Enum


class Message(Enum):
    # INITIAL STATE
    STATE = "STATE"
    # QUEUE LIST
    LIST_OPERATION = "LIST_OPERATION"
    # PLAYBACK
    MEDIA_ACTION = "MEDIA_ACTION"
    SONG_END = "SONG_END"
    # CONTROL
    OBTAIN_CONTROL = "OBTAIN_CONTROL"
    RELEASE_CONTROL = "RELEASE_CONTROL"
    # SEARCH
    SEARCH = "SEARCH"


# List Operations
class QueueOp(Enum):
    ADD = "ADD"  # ADD <code> -> <id>
    DEL = "DEL"  # DEL <id>
    MOVE = "MOVE"  # MOVE <id> <displacement>


class MediaAction(Enum):
    PLAY = "PLAY"
    PAUSE = "PAUSE"
    NEXT = "NEXT"
    PREVIOUS = "PREVIOUS"


class PlayerState(Enum):
    PLAYING = "PLAYING"
    PAUSED = "PAUSED"
    LIST_END = "LIST_END"
