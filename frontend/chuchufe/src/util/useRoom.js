import { defaultRoom } from "./room";
import { useEffect, useRef, useState } from "react";
import { makeMessage, Resolver } from "./Resolver";
import { MessageTypes } from "./enums";
import stateProcessor from "./processors/stateProcessor";
import listOperationProcessor from "./processors/listOperationProcessor";
import mediaActionProcessor from "./processors/mediaActionProcessor";
import controlProcessor from "./processors/controlProcessor";
import searchIdResultProcessor from "./processors/searchIdResultProcessor";

function registerHandlers(resolver) {
    resolver.register(MessageTypes.STATE, stateProcessor);
    resolver.register(MessageTypes.LIST_OPERATION, listOperationProcessor);
    resolver.register(MessageTypes.MEDIA_ACTION, mediaActionProcessor);
    resolver.register(MessageTypes.OBTAIN_CONTROL, (ws, _, clientData) => controlProcessor(ws, { obtain: true }, clientData))
    resolver.register(MessageTypes.RELEASE_CONTROL, (ws, _, clientData) => controlProcessor(ws, { obtain: false }, clientData))
    resolver.register(MessageTypes.SEARCH_ID, searchIdResultProcessor)
}

function unRegisterHandlers(resolver) {
    resolver.unregister(MessageTypes.STATE)
    resolver.unregister(MessageTypes.LIST_OPERATION)
    resolver.unregister(MessageTypes.MEDIA_ACTION)
    resolver.unregister(MessageTypes.OBTAIN_CONTROL)
    resolver.unregister(MessageTypes.RELEASE_CONTROL)
    resolver.unregister(MessageTypes.SEARCH_ID)
}


export default function useRoom(path) {
    const [room, setRoom] = useState({ ...defaultRoom });

    const resolverRef = useRef(new Resolver());
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (path !== null) {
            const ws = resolverRef.current.connectSocket(path);
            ws.addEventListener("open", function () {
                setConnected(true);
                ws.send(makeMessage(MessageTypes.STATE, null))
            });
            ws.addEventListener("message", console.log);
            return (() => {
                ws.close();
                setConnected(false);
            })
        }
    }, [path])

    useEffect(() => {
        const currentResolver = resolverRef.current;
        if (connected && currentResolver.websocket !== null) {
            const handler = (event) => currentResolver.resolve(
                currentResolver.websocket,
                event.data,
                [room, setRoom]
            )
            currentResolver.websocket.addEventListener('message', handler);
            return () => currentResolver.websocket.removeEventListener('message', handler)
        }
    }, [room, connected])

    useEffect(() => {
        const resolver = resolverRef.current
        registerHandlers(resolver)
        return () => unRegisterHandlers(resolver)
    }, [connected, resolverRef])

    const resolver =resolverRef.current;
    const websocket = resolver.websocket;

    return {
        room,
        setRoom,
        resolver,
        socket: {
            connected,
            ws: websocket,
            send: websocket ? websocket.send : (...r) => console.error("websocket is not created yet. please do no try to send anything already. have some patience", r)
        }
    }
}

