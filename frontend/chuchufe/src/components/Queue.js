import React from "react";
import { ListOperationTypes, MessageTypes } from "../util/enums";
import { makeMessage } from "../util/Resolver";


export default function Queue({ room, socket }) {
    const { chueue, videoInfoMap } = room
    const { queue } = chueue;

    function onDeleteClick(e, id) {
        e.preventDefault();
        socket.ws.send(makeMessage(MessageTypes.LIST_OPERATION, { op: ListOperationTypes.DEL, id }))
    }

    function onMoveClick(e, id, displacement) {
        e.preventDefault();
        socket.ws.send(makeMessage(MessageTypes.LIST_OPERATION, { op: ListOperationTypes.MOVE, id, displacement }))
    }

    return <div className="list-group">
        {queue.map(({ code, id }) => {
            // TODO PublishTime
            const { thumbnails, title, channelTitle, description } = videoInfoMap.has(code) ? videoInfoMap.get(code) : {};
            return <div className="videoListCard list-group-item" key={id}>
                <div className="row">
                    <div className="col-1">
                        <div className="videoListCardMoveUp"
                             onClick={(e) => onMoveClick(e, id, -1)}>
                            <i className="fa fa-caret-up"/>
                        </div>
                        <div className="videoListCardMoveDown"
                             onClick={(e) => onMoveClick(e, id, 1)}>
                            <i className="fa fa-caret-down"/>
                        </div>
                    </div>
                    <div className="videoListCardThumbnail col-3">
                        {thumbnails && thumbnails.default &&
                        <img src={thumbnails.default.url} width={thumbnails.default.width}
                             height={thumbnails.default.height} alt=""/>}
                    </div>
                    <div className="col-7 videoListCardTextContainer">
                        <span className="h4 videoListCardTitle">{title || "..."}</span><br/>
                        <span className="videoListCardChannel pr-3">{channelTitle || "..."}</span>
                        <span className="videoListCardDescription">{description || "..."}</span>
                    </div>
                    <div className="col-1">
                        <button className="videoListCardDelete btn btn-outline-danger"
                                onClick={(e) => onDeleteClick(e, id)}>
                            <i className="fa fa-trash-alt"/>
                        </button>
                    </div>
                </div>
            </div>
        })}
    </div>
}