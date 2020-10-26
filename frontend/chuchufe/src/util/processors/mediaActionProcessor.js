import { MediaAction, PlayerState } from "../enums";
import { Chueue } from "../room";

export default function mediaActionProcessor(ws, data, [{ chueue, playback, ...rest }, setRoom]) {
    const { action, ended_id, enable } = data;
    const { repeatEnabled } = chueue;
    const { state, song } = playback;
    const newPlayback = {};
    let newChueue;

    if (action === MediaAction.PLAY && state === PlayerState.PAUSED) {
        newPlayback.state = PlayerState.PLAYING;
    } else if (action === MediaAction.PAUSE && state === PlayerState.PLAYING) {
        newPlayback.state = PlayerState.PAUSED;
    } else if (action === MediaAction.NEXT) {
        console.log(action, song, ended_id)
        if (song !== null && song.id === ended_id) {
            const res = Chueue.pop(chueue);
            console.log("pop", res)
            newPlayback.song = res.song;
            newChueue = res.chueue;
            if (res.song === null) {
                newPlayback.state = PlayerState.LIST_END; // TODO deprecated
            }
        }
    } else if (action === MediaAction.REPEAT) {
        if (enable !== repeatEnabled) {
            newChueue = Chueue.setRepeatEnabled(chueue, enable, song)
        }
    }

    setRoom({
        chueue: { ...chueue, ...newChueue },
        playback: { ...playback, ...newPlayback },
        ...rest,
    })

}