const PORT = process.env.NODE_ENV === "development" ? 38210 : 3821
const HOST = window.location.hostname
const PROTOCOL = process.env.NODE_ENV === "development" ? "ws" : "wss"

export class Resolver {
    registerMap = null;
    websocket = null;

    constructor() {
        this.registerMap = new Map()
    }

    register(message, handler) {
        this.registerMap.set(message, handler)
    }

    unregister(message) {
        return this.registerMap.delete(message)
    }

    resolve(websocket, serverData, clientData) {
        const message = JSON.parse(serverData)
        if (typeof message != "object") {
            console.error(`Received message is not a json object but a ${typeof message}`, message)
            return
        }

        if (!("__message" in message)) {
            console.error(`Received message does not have required '__message' field.`, message)
            return
        }

        const message_type = message["__message"]

        if (!(this.registerMap.has(message_type))) {
            console.error(`No handler for message type ${message_type}.`, message)
            return
        }

        if ("__body" in message) {
            this.registerMap.get(message_type)(websocket, message["__body"], clientData)
        } else {
            this.registerMap.get(message_type)(websocket, null, clientData)
        }

    }

    connectSocket(path) {
        this.websocket = new WebSocket(`${PROTOCOL}://${HOST}:${PORT}/${path}`)
        window.socket = this.websocket;
        return this.websocket
    }
                                            
}

export function makeMessage(messageType, body) {
    return JSON.stringify({ "__message": messageType, "__body": body })
}


