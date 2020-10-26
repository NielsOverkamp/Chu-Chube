import React from "react";
import bg from '../img/icon-bg.svg'
import train from '../img/icon-train.svg'

export default function LoadingLogo() {
    return <div className="loadingLogoContainer">
        <div className="loadingLogoContainingBlock">
            <img className="loadingLogoBg" src={bg} alt="loading icon"/>
            <img className="loadingLogo" src={train} alt=""/>
        </div>
    </div>
}