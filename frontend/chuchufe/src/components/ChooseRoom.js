import React from 'react';
import logo100 from '../img/logo-100.png'


export default function ChooseRoom({setPath}) {
    function onSubmit(e) {
        e.preventDefault();
        const path = e.target[0].value
        if (path && path !== "") {
            setPath(path);
        }
    }

    return <div className="container absoluteCenter" style={{height: "135px"}}>
        <div style={{marginTop: "-100px"}}>
            <div className="row mb-4">
                <img className="mx-auto" alt="ChuChube logo" src={logo100} />
            </div>
            <div className="row">
                <form className="mx-auto" id="roomInputForm" onSubmit={onSubmit}>
                    <div className="form-group">
                        <label className="sr-only" htmlFor="roomInput">Room Input</label>
                        <input className="form-control" id="roomInput" placeholder="Room" autoFocus/>
                    </div>
                </form>
            </div>
        </div>
    </div>
}