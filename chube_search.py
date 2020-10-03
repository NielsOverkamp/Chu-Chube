import asyncio
import os
import aiohttp

from chube_enums import Message
from chube_ws import Resolver, make_message

API_KEY = os.environ.get('GOOGLE_SEARCH_API_KEY')
URL = "https://www.googleapis.com/youtube/v3/search"

base_query = [('part', 'snippet'), ('type', 'video'), ('videoEmbeddable', 'true'), ('safeSearch', 'none'), ('key', API_KEY)]


async def search_processor(ws, data, path):
    async with aiohttp.ClientSession() as session:
        async with session.get(URL, params=base_query + [('q', data['q'])]) as response:
            json_data = await response.json()
            await ws.send(make_message(Message.SEARCH, json_data))
    

def make_resolver():
    resolver = Resolver()
    resolver.register(Message.SEARCH, search_processor)
    return resolver


if __name__ == "__main__":
    async def foo():
        async with aiohttp.ClientSession() as session:
            async with session.get(URL, params=base_query + [('q', "She")]) as response:
                json_data = await response.json()
                print(json_data)
    loop = asyncio.get_event_loop()
    loop.run_until_complete(foo())