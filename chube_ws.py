import asyncio
import json
import os

import websockets

from chube_enums import Message

PORT = os.environ.get("CHUBE_WS_PORT") or 3821  # CHU
HOST = os.environ.get("CHUBE_WS_HOST") or "localhost"


class Resolver:
    _registerDict: dict = {}

    def register(self, message: Message, handler):
        self._registerDict[message.value] = handler

    def unregister(self, message):
        return self._registerDict.pop(message.value)

    def resolve(self, data):
        message = json.loads(data)
        if not isinstance(message, dict):
            raise Exception("Received bytes is not a json object but a {}. {}".format(type(message), message))

        if "__message" not in message:
            raise Exception("Received message does not have required '__message' field. {}".format(message))

        message_type = message["__message"]

        if message_type not in self._registerDict:
            raise Exception("No handler for message type {}. {}".format(message_type, message))

        if "__body" not in message:
            return self._registerDict[message_type], None
        else:
            return self._registerDict[message_type], message["__body"]

    def make_handler(self, on_open=None, on_close=None):
        async def on_open_handler(websocket, path):
            if on_open is not None:
                await on_open(websocket, path)

        async def on_close_handler(websocket, path):
            if on_close is not None:
                await on_close(websocket, path)

        async def handler(websocket, path):
            await on_open_handler(websocket, path.lower())
            try:
                while True:
                    message = await websocket.recv()
                    processor, body = self.resolve(message)
                    await processor(websocket, body, path.lower())
            except websockets.ConnectionClosed:
                await on_close_handler(websocket, path.lower())

        return handler

    def add_all(self, search_resolver: "Resolver"):
        for message, handler in search_resolver._registerDict.items():
            self._registerDict[message] = handler


def make_message(message_type, body=None):
    return json.dumps({"__message": message_type.value, "__body": body})


def make_message_from_json_string(message_type, raw_body: str):
    return "{{\"__message\": \"{}\", \"__body\": {}}}".format(message_type.value, raw_body)


def start_server(resolver: Resolver, on_new_connection, on_connection_close):
    ws_server = websockets.serve(
        resolver.make_handler(on_open=on_new_connection, on_close=on_connection_close),
        HOST, PORT)
    asyncio.get_event_loop().run_until_complete(ws_server)
    asyncio.get_event_loop().run_forever()
