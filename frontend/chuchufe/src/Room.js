import { PlayerState } from "./enums";

export const defaultRoom = {
    chueue: {
        queue: [],
        playedQueue: [],
        repeatEnabled: false,
    },
    playback: {
        song: null,
        state: PlayerState.LIST_END,
    },
    controller: {
        isMe: false,
    },
}

export const Chueue = {
    add: function ({ queue, ...rest }, ...songs) {
        return {
            queue: queue + songs,
            ...rest
        }
    },

    remove: function ({ queue, ...rest }, ...ids) {
        return {
            queue: queue.filter(({ id }) => !ids.contains(id)),
            ...rest
        }
    },

    move: function ({ queue, ...rest }, displacement, id) {
        const i = queue.findIndex(({ qId }) => qId === id)
        const song = queue[i]
        const new_i = i + displacement
        const temp_queue = queue.slice(0, i).concat(queue.slice(i + 1))
        return {
            queue: temp_queue.slice(0, new_i).concat([song]).concat(temp_queue.slice(new_i)),
            ...rest,
        }
    },

    pop: function ({ queue, playedQueue, repeatEnabled, ...rest }) {
        if (queue.length <= 0) {
            if (repeatEnabled && playedQueue.length > 0) {
                return {
                    song: playedQueue[playedQueue.length - 1],
                    chueue: {
                        queue: playedQueue.slice(0, -1),
                        playedQueue: [],
                        repeatEnabled,
                        ...rest
                    }
                }
            }
        }
    },

    setRepeatEnabled: function (chueue, enable, playbackSong) {
        if (enable) {
            if (playbackSong) {
                return {
                    ...chueue,
                    playedQueue: [playbackSong],
                    repeatEnabled: enable
                }
            } else {
                return {
                    ...chueue,
                    playedQueue: [],
                    repeatEnabled: enable
                }
            }
        } else {
            return {
                ...chueue,
                playedQueue: null,
                repeatEnabled: enable
            }
        }
    }
}

export const Playback = {
    setSong: function (playback, song) {
        return {
            ...playback,
            song
        }
    },

    getSong: function ({ song }) {
        return song
    },

    getSongId: function ({ song }) {
        return song && song.id
    },

    setState: function (playback, state) {
        return {
            ...playback,
            state
        }
    },

    getState: function ({ state }) {
        return state
    }
}

export const Controller = {
    setIsMe: function (controller, isMe) {
        return {
            ...controller,
            isMe
        }
    },

    isMe: function ({ isMe }) {
        return isMe
    },
}
