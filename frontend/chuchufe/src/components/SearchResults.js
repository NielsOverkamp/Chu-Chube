import React from 'react';
import { ListOperationTypes, MessageTypes, YoutubeResourceType } from "../util/enums";
import { makeMessage } from "../util/Resolver";
import useMapBuilder from "../util/useMapBuilder";

function makeSearchResult(item, socket, addVideoInfo) {
    const { id, snippet } = item
    const { kind, videoId, channelId, playlistId } = id
    const { thumbnails, title, channelTitle, description } = snippet

    const code = kind === YoutubeResourceType.CHANNEL ? channelId :
        kind === YoutubeResourceType.PLAYLIST ? playlistId :
            kind === YoutubeResourceType.VIDEO ? videoId :
                console.error(`Unknown kind ${kind}`)

    if (!code) return null;

    function onClickHandler() {
        socket.ws.send(makeMessage(MessageTypes.LIST_OPERATION, {
            op: ListOperationTypes.ADD,
            kind,
            code
        }));
        if (kind === YoutubeResourceType.VIDEO) {
            addVideoInfo(videoId, snippet)
        }
    }

    const { url, width, height } = (thumbnails ? thumbnails["default"] : {
        url: "/img/no_thumbnail.png",
        width: 120,
        height: 90
    })

    return <div className="searchResult list-group-item list-group-item-action" onClick={onClickHandler} key={code}>
        <div className="row">
            <div className="searchResultThumbnail col-3">
                <div className="thumbnailContainer">
                    <div className="thumbnailImage">
                        <img src={url} width={width} height={height} alt=""/>
                    </div>
                    {kind === YoutubeResourceType.PLAYLIST &&
                    <div className="thumbnailPlaylistOverlay">
                        <i className="fa fa-bars"/>
                    </div>
                    }
                </div>
            </div>
            <div className="col-9 searchResultTextContainer">
                <span className="h4 searchResultTitle">{title}</span><br/>
                <span className="searchResultChannel pr-3">{channelTitle}</span>
                <span className="searchResultDescription">{description}</span>
            </div>
        </div>
    </div>

}

export default function SearchResults({ searchResults, socket, videoInfoMap, setVideoInfoMap }) {

    const addVideoInfo = (k, v) => setVideoInfoMap(new Map(videoInfoMap).set(k,v));

    return <div className="row">
        <div className="list-group col">
            {(searchResults || []).map((item) => makeSearchResult(item, socket, addVideoInfo))}
        </div>
    </div>
}