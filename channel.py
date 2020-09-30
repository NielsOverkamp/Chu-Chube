class Channel:
    subscribers = []

    def subscribe(self, ws):
        self.subscribers.append(ws)

    def unsubscribe(self, ws):
        self.subscribers.remove(ws)

    async def send(self, message):
        for ws in self.subscribers:
            if ws.open:
                await ws.send(message)
            else:
                self.unsubscribe(ws)
