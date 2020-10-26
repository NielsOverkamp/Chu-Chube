import React, { useState } from 'react';
import './css/App.css';
import './css/fontawesome.css';
import './css/solid.css';
import './css/bootstrap/bootstrap.css';
import './css/main.css';
import useRoom from "./util/useRoom";
import ChooseRoom from "./components/ChooseRoom";
import Room from "./components/Room";


// const PATH = new URLSearchParams(window.location.search).get("room")
// if (PATH === "" || PATH === undefined || PATH === null) {
//     window.location = "/";
// }



function App() {
    const [path, setPath] = useState(null);
    const {room, setRoom, resolver, socket} = useRoom(path);

    if (socket.connected) {
        return <Room room={room}
                     setRoom={setRoom}
                     exitRoom={() => setPath(null)}
                     socket={socket}
                     resolver={resolver}
        />;
    } else {
        return <ChooseRoom setPath={setPath}/>
    }
}

export default App;
