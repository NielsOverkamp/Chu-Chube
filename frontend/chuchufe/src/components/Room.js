import React, { Fragment } from "react";
import NavBar from "./NavBar";
import Search from "./Search";
import Player from "./Player";
import Queue from "./Queue";

export default function Room({ room, setRoom, exitRoom, resolver, socket }) {
    console.log(room);

    return <Fragment>
        <NavBar exitRoom={exitRoom}/>
        <div className="container">
            <div className="row">
                <div className="col-xl-6 col-sm-12">
                    <Search socket={socket} resolver={resolver}
                            videoInfoMap={room.videoInfoMap}
                            setVideoInfoMap={(m) => setRoom({...room, videoInfoMap: m})}/>
                </div>
                <div className="col-xl-6 col-sm-12">
                    <div className="row">
                        <div className="col-12">
                            <Player room={room} setRoom={setRoom} socket={socket}/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <Queue room={room} setRoom={setRoom} socket={socket} resolver={resolver}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Fragment>
}