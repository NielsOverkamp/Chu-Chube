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
    PLAYER_ENABLED = "PLAYER_ENABLED"
    # SEARCH
    SEARCH = "SEARCH"
    SEARCH_ID = "SEARCH_ID"


# List Operations
class QueueOp(Enum):
    ADD = "ADD"  # ADD <code> -> <id>
    DEL = "DEL"  # DEL <id>
    MOVE = "MOVE"  # MOVE <id> <displacement>
    CLEAR = "CLEAR"


class MediaAction(Enum):
    PLAY = "PLAY"
    PAUSE = "PAUSE"
    NEXT = "NEXT"
    PREVIOUS = "PREVIOUS"
    REPEAT = "REPEAT"
    SHUFFLE = "SHUFFLE"


class PlayerState(Enum):
    PLAYING = "PLAYING"
    PAUSED = "PAUSED"
    LIST_END = "LIST_END"


class YoutubeResourceType(Enum):
    VIDEO = "youtube#video"
    PLAYLIST = "youtube#playlist"
    CHANNEL = "youtube#channel"
