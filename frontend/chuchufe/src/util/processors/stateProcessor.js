import { makeMessage } from "../Resolver";
import { MessageTypes, PlayerState } from "../enums";

export default function stateProcessor(ws, data, [{ chueue, playback, controller, ...rest }, setRoom]) {
    const { playing, state, lists } = data;
    const { next, previous } = lists

    const newRoom = {
        chueue: {
            queue: next,
            playedQueue: previous,
            repeatEnabled: !!previous,
        },
        playback: {
            song: playing,
            state: state,
        },
        controller: {
            isMe: false,
        },
        ...rest,
    }

    const codes = new Set()
    for (const song of next) {
        const { code } = song
        codes.add(code)
    }

    for (const song of previous || []) {
        const { code } = song;
        codes.add(code)
    }

    if (codes.size > 0) {
        ws.send(makeMessage(MessageTypes.SEARCH_ID, { id: Array.from(codes) }))
    }

    if (playing !== null) {
        if (state === PlayerState.PLAYING) {
            // Playback.play(playing) // TODO
        } else {
            // Playback.load(playing)
        }
    }

    setRoom(newRoom);
    // if (isLeader === null) {
    //     setLeader(false) // TODO
    // }
    // afterStateInit()
}
