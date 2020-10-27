import React, { Fragment, useEffect, useState } from "react";
import { MessageTypes } from "../util/enums";
import { makeMessage } from "../util/Resolver";
import SearchResults from "./SearchResults";

export default function Search({ resolver, socket, videoInfoMap, setVideoInfoMap }) {
    const [searchItems, setSearchItems] = useState();


    useEffect(() => {
        resolver.register(MessageTypes.SEARCH, (_, { items }) => setSearchItems(items))
        return () => resolver.unregister(MessageTypes.SEARCH)
    }, [resolver])

    function search(event) {
        event.preventDefault();
        const q = event.target[0].value
        if (q !== "" && socket.connected) {
            socket.ws.send(makeMessage(MessageTypes.SEARCH, { q }))
        }
    }

    return <Fragment>
        <div className="row">
            <form id="searchVideoForm" className="form-inline my-4" onSubmit={search}>
                <div className="form-group">
                    <label htmlFor="searchVideo" className="sr-only">Search</label>
                    <input id="searchVideo" className="form-control" placeholder="Search Video"/>
                </div>
            </form>
        </div>
        <SearchResults searchResults={searchItems} videoInfoMap={videoInfoMap} setVideoInfoMap={setVideoInfoMap} socket={socket}/>
    </Fragment>
}