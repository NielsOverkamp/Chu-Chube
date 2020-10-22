import React from 'react';
import './css/App.css';
import useRoom from "./useRoom";


const PATH = new URLSearchParams(window.location.search).get("room")
if (PATH === "" || PATH === undefined || PATH === null) {
    window.location = "/";
}



function App() {
    const [room] = useRoom();

    return JSON.stringify(room);
}

export default App;
