import React, { Fragment, useEffect, useState } from 'react';
import './css/App.css';
import './css/fontawesome.css';
import './css/solid.css';
import './css/bootstrap/bootstrap.css';
import './css/main.css';
import './css/ChuChubeFont.css'
import useRoom from "./util/useRoom";
import ChooseRoom from "./components/ChooseRoom";
import Room from "./components/Room";
import LoadingLogo from "./components/LoadingLogo";
import NavBar from "./components/NavBar";

function getPathFromUrl() {
    return new URLSearchParams(window.location.search).get("room") || null
}

function App() {
    const [path, setPath] = useState(getPathFromUrl());
    const { room, setRoom, resolver, socket } = useRoom(path);

    useEffect(() => {
        window.onpopstate = (_) => {
            setPath(getPathFromUrl());
        }
    })

    useEffect(() => {
        if (path === null) {
            const title = "ChuChube - Choose Room";
            window.history.pushState({}, title, "/")
            document.title = title;
        } else {
            const title = `ChuChube - ${path}`;
            window.history.pushState({}, title, `player?room=${path}`)
            document.title = title;
        }
    }, [path])

    if (path === null) {
        return <ChooseRoom setPath={setPath}/>
    } else if (socket.connected) {
        return <Room room={room}
                     setRoom={setRoom}
                     exitRoom={() => setPath(null)}
                     socket={socket}
                     resolver={resolver}
        />;
    } else {
        return <Fragment>
            <NavBar exitRoom={() => setPath(null)}/>
            <div className="absoluteCenter" style={{height: "200px"}}>
                <LoadingLogo/>
            </div>
        </Fragment>
    }
}

export default App;
