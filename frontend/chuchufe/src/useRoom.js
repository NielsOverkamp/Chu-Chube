import { defaultRoom } from "./Room";
import { useEffect, useRef, useState } from "react";
import { makeMessage, Resolver } from "./Resolver";
import { MessageTypes, PlayerState } from "./enums";


export default function useRoom(path) {
    const [room, setRoom] = useState(defaultRoom);

    const resolver = useRef(new Resolver());

    useEffect(() => {
        resolver.current.register(MessageTypes.STATE, stateProcessor);
        const ws = resolver.current.connectSocket(path);
        ws.addEventListener("open", function () {
            ws.send(makeMessage(MessageTypes.STATE, null))
        });
        ws.addEventListener("message", console.log);
        return (() => ws.close)
    }, [])

    useEffect(() => {
        const currentResolver = resolver.current;
        if (currentResolver.websocket !== null) {
            const handler = (event) => currentResolver.resolve(
                currentResolver.websocket,
                event.data,
                [room, setRoom]
            )
            currentResolver.websocket.addEventListener('message', handler);
            return () => currentResolver.websocket.removeEventListener('message', handler)
        }
    }, [room])


    return [room, setRoom]
}

function stateProcessor(ws, data, [{ chueue, playback, controller, ...rest }, setRoom]) {
    const { playing, state, lists } = data;
    const { next, previous } = lists

    const newRoom = {
        chueue: {
            queue: next,
            queuePlayed: previous,
            repeatEnabled: !!previous,
        },
        playback: {
            song: playing,
            state: state,
        },
        controller: {
            isMe: false,
        }

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

    if (codes.length > 0) {
        ws.send(makeMessage(MessageTypes.SEARCH_ID, { id: codes }))
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
