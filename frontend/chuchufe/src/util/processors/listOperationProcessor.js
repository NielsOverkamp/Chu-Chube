import { ListOperationTypes, MessageTypes, PlayerState } from "../enums";
import { Chueue } from "../room";
import { makeMessage } from "../Resolver";

export default function processListOperation(ws, data, [{ chueue, ...rest }, setRoom]) {
    const { op, items } = data;
    let newChueue;
    switch (op) {
        case ListOperationTypes.ADD:
            newChueue = Chueue.add(chueue, items.map(({ code, id }) => ({ code, id })))

            const {playback, videoInfoMap} = rest;

            const newPlayback = {}

            if (playback.song === null) {
                const res = Chueue.pop(newChueue)
                newChueue = res.chueue;
                newPlayback.song = res.song;
                newPlayback.state = PlayerState.PLAYING; // TODO Deprecate
            }

            const newVideoInfoMap = new Map(videoInfoMap)

            const noCodeInfo = []
            for (const { code, snippet } of items) {
                if (snippet !== undefined) {
                    newVideoInfoMap.set(code, snippet);
                } else if (!rest.videoInfoMap.has(code)) {
                    noCodeInfo.push(code)
                }
            }

            setRoom({
                chueue: {...chueue, ...newChueue},
                ...rest,
                videoInfoMap: newVideoInfoMap,
                playback: {...playback, ...newPlayback},
            })

            if (noCodeInfo.length > 0) {
                ws.send(makeMessage(MessageTypes.SEARCH_ID, { id: noCodeInfo }))
            }
            break;
        case ListOperationTypes.DEL:
            setRoom({
                chueue: Chueue.remove(chueue, items.map(({ id }) => id)),
                ...rest
            })
            break;
        case ListOperationTypes.MOVE:
            newChueue = chueue;
            for (const { id, displacement } of items) {
                newChueue = Chueue.move(newChueue, displacement, id)
            }
            setRoom({
                chueue: newChueue,
                ...rest,
            })
            break;
        default:
            console.error("Unknown ListOperationType", op);
            break;
    }

}
