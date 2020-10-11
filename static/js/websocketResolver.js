const PORT = 3821
const HOST = location.hostname
const PATH = new URLSearchParams(location.search).get("room")
if (PATH === "" || PATH === undefined || PATH === null) {
    window.location = "/";
}

export class Resolver {
    registerMap = new Map()

    register(message, handler) {
        console.log("register", message, handler)
        this.registerMap.set(message, handler)
    }

    unregister(message) {
        return this.registerMap.delete(message)
    }

    resolve(data, websocket) {
        const message = JSON.parse(data)
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
            this.registerMap.get(message_type)(websocket, message["__body"])
        } else {
            this.registerMap.get(message_type)(websocket, null)
        }

    }

    connectSocket() {
        const self = this;
        const socket = new WebSocket(`ws://${HOST}:${PORT}/${PATH}`)

        function handler(event) {
            self.resolve(event.data, socket)
        }

        socket.addEventListener('message', handler)

        return socket
    }

}

export function makeMessage(messageType, body) {
    return JSON.stringify({ "__message": messageType, "__body": body })
}

