import React, { Fragment } from "react";
import { makeMessage } from "../util/Resolver";
import { MediaAction, MessageTypes, PlayerState } from "../util/enums";

function onButtonClass(on) {
    if (on) {
        return 'btn-secondary'
    } else {
        return 'btn-outline-secondary'
    }
}

export default function PlayerToolbar({ playback, repeatEnabled, playerEnabled, setPlayerEnabled, isController, socket }) {
    const { state, song } = playback;

    function onControllerClick(event) {
        event.preventDefault();
        if (!playerEnabled || !state) {
            return;
        }
        if (isController) {
            socket.ws.send(makeMessage(MessageTypes.RELEASE_CONTROL))
        } else {
            socket.ws.send(makeMessage(MessageTypes.OBTAIN_CONTROL))
        }
    }

    function onPlayClick(event) {
        event.preventDefault();
        if (state === PlayerState.PAUSED) {
            socket.ws.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.PLAY }))
        }
    }

    function onPauseClick(event) {
        event.preventDefault();
        if (state === PlayerState.PLAYING) {
            socket.ws.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.PAUSE }))
        }
    }

    function onNextClick(event) {
        event.preventDefault();
        console.log("next", song)
        if (song !== null) {
            socket.ws.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.NEXT, current_id: song.id }))
        }
    }

    function onRepeatClick(event) {
        event.preventDefault();
        socket.ws.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.REPEAT, enable: !repeatEnabled }))
    }

    return <Fragment>
        <div className="btn-toolbar col-11">
            <div className="btn-group mr-2">
                <button className={`btn ${onButtonClass(isController)}`}
                        disabled={!state || !playerEnabled}
                        onClick={onControllerClick}
                        title={!state ? "Please check your internet connectivity or contact the owner" :
                            !playerEnabled ? "You need to enable the player before you can be leader" :
                                isController ? "Click to release leadership of this room" : "Click to obtain leadership of this room"}>
                    {!state ? "No connection" :
                        !playerEnabled ? "Remote" :
                            isController ? "Leader" : "Listener"}
                </button>
            </div>
            <div className="btn-group mr-2" >
                <button className={`btn ${onButtonClass(state === PlayerState.PLAYING)}`}
                        onClick={onPlayClick}>
                    <i className="fa fa-play"/></button>
                <button className={`btn ${onButtonClass(state === PlayerState.PAUSED)}`}
                        onClick={onPauseClick}>
                    <i className="fa fa-pause"/></button>
                <button className="btn btn-outline-secondary" onClick={onNextClick}>
                    <i className="fa fa-forward"/></button>
            </div>
            <div className="btn-group mr-2" title="repeat">
                <button className={`btn ${onButtonClass(repeatEnabled)}`} onClick={onRepeatClick}>
                    <i className="ccf ccf-repeat alignMiddle"/>
                </button>
            </div>
        </div>
        {playerEnabled &&
        <span className="col-1">
            <button className="btn btn-link closePlayer" onClick={() => setPlayerEnabled(false)}><i className="fa fa-times"/></button>
        </span>
        }
    </Fragment>
}