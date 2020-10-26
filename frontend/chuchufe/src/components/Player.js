import React, { Fragment, useEffect, useState } from "react";
import YoutubePlayer from "./YoutubePlayer";
import PlayerToolbar from "./PlayerToolbar";
import { makeMessage } from "../util/Resolver";
import { MessageTypes } from "../util/enums";
import { Chueue } from "../util/room";


export default function Player({ room, setRoom, socket }) {
    const { playback, controller, chueue } = room;
    const { isMe } = controller;
    const { repeatEnabled } = chueue;

    const [playerEnabled, setPlayerEnabled] = useState(false);
    const [previousPlayerEnabled, setPreviousPlayerEnabled] = useState(playerEnabled);
    const [placeholderHidden, setPlaceholderHidden] = useState(false);

    useEffect(() => {
        setPreviousPlayerEnabled(playerEnabled);
    }, [playerEnabled]);

    useEffect(() => {
        console.log(socket);
        if (socket.ws.readyState === WebSocket.OPEN && playerEnabled !== previousPlayerEnabled) {
            socket.ws.send(makeMessage(MessageTypes.PLAYER_ENABLED, { enabled: playerEnabled }))
        }
    }, [playerEnabled, previousPlayerEnabled, socket])


    function onSongEnd() {
        if (isMe && playback.song !== null) {
            socket.ws.send(makeMessage(MessageTypes.SONG_END, { id: playback.song.id }))
            const { song: newSong, chueue: newChueue } = Chueue.pop(chueue)
            setRoom({
                ...room,
                chueue: { ...chueue, ...newChueue },
                playback: { ...playback, song: newSong },
            })
        }
    }

    let player;

    if (playerEnabled) {
        player = <YoutubePlayer playback={playback} onSongEnd={onSongEnd}/>
    } else if (placeholderHidden) {
        player =
            <button className="btn btn-link btn-sm text-secondary pl-2" onClick={() => setPlaceholderHidden(false)}>
                Show
            </button>
    } else {
        player = <div className="col-12">
            <div className="playerContainer">
                <div className="d-flex justify-content-center playerPlaceholder">
                    <div>
                        <button className="btn btn-outline-secondary"
                                onClick={() => setPlayerEnabled(true)}>
                            Start Player
                        </button>
                        <br/>
                        <button className="btn btn-link btn-sm small text-secondary"
                                style={{ width: "100%" }}
                                onClick={() => setPlaceholderHidden(true)}>
                            Hide
                        </button>
                    </div>
                </div>
            </div>
        </div>
    }

    return <Fragment>
        <div className="row">
            <PlayerToolbar playback={playback} repeatEnabled={repeatEnabled}
                           playerEnabled={playerEnabled} setPlayerEnabled={setPlayerEnabled}
                           socket={socket} isController={isMe}/>
        </div>
        <div className="row">
            {player}
        </div>
    </Fragment>
}