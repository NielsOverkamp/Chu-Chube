import { PlayerState } from "../enums";
import { Chueue } from "../room";

const RTT_ESTIMATE = 1
const ALLOWED_AHEAD = 5

export default function songEndProcessor(ws, data, [{ playback, chueue, controller, ...rest }, setRoom]) {
    const { ended_id, current_id } = data;
    const { song } = playback;
    const newPlayback = {};
    let newChueue;
    console.log(ended_id, current_id)
    if (song === null) {
        // Do nothing
    } else if (ended_id === song.id) {
        const res = Chueue.pop(chueue)
        newChueue = res.chueue;
        newPlayback.song = res.song;
        if (res.song === null) {
            newPlayback.state = PlayerState.LIST_END // TODO deprecated
            // TODO SEEK TO END
        }
    } else if (current_id === song.id) {
        // TODO better time sync
        // if (!isMe && player.getCurrentTime() - RTT_ESTIMATE - ALLOWED_AHEAD > 0) {
        //     player.seekTo(RTT_ESTIMATE + ALLOWED_AHEAD, true)
        // }
    } else {
        console.error("Difficult state reached. Reset protocol not implemented. Either to far ahead, behind or state inconsistency", ended_id, current_id, song)
    }

    setRoom({
        chueue: {...chueue, ...newChueue},
        playback: {...playback, ...newPlayback},
        controller, ...rest
    })                                                                                                                              

}