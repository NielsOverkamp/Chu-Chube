import React from "react";
import logo100 from '../img/logo-100.png';

export default function NavBar({ exitRoom }) {
    return <button className="btn btn-link navBarLogo" onClick={exitRoom}>
        <img src={logo100} alt="ChuChube Logo" height="50px"/>
    </button>
}