import React from "react";

export default function LoadingLogo({scale}) {
    const scaleFactor = scale === undefined ? 1 : scale;
    return <div className="loadingLogoContainer" style={{fontSize: `${scaleFactor*80}pt`}}>
        <div className="loadingLogoContainingBlock">
            <i className="loadingLogoBg ccf ccf-logo-bg text-chuchube-red"/>
            <i className="loadingLogo ccf ccf-logo-train text-white" style={{fontSize: `${scaleFactor*44}pt`}}/>
        </div>
    </div>
}