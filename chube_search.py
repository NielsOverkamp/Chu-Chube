import asyncio
import os

import aiohttp

from chube_enums import Message
from chube_ws import Resolver, make_message

API_KEY = os.environ.get('GOOGLE_SEARCH_API_KEY')
SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
SEARCH_ID_URL = "https://www.googleapis.com/youtube/v3/videos"

BASE_QUERY_SEARCH = [('part', 'snippet'), ('type', 'video'), ('videoEmbeddable', 'true'), ('safeSearch', 'none'),
                     ('key', API_KEY)]

BASE_QUERY_ID_SEARCH = [('part', 'snippet'), ('key', API_KEY)]


async def search_processor(ws, data, path):
    async with aiohttp.ClientSession() as session:
        async with session.get(SEARCH_URL, params=BASE_QUERY_SEARCH + [('q', data['q'])]) as response:
            json_data = await response.json()
            await ws.send(make_message(Message.SEARCH, json_data))


async def search_id_processor(ws, data, path):
    ids = data["id"]
    if not isinstance(ids, list):
        ids = {ids}
    else:
        ids = set(ids)
    async with aiohttp.ClientSession() as session:
        async with session.get(SEARCH_ID_URL, params=BASE_QUERY_ID_SEARCH + [('id', ",".join(ids))]) as response:
            json_data = await response.json()
            await ws.send(make_message(Message.SEARCH_ID, json_data))


def make_resolver():
    resolver = Resolver()
    resolver.register(Message.SEARCH, search_processor)
    resolver.register(Message.SEARCH_ID, search_id_processor)
    return resolver


if __name__ == "__main__":
    async def foo():
        async with aiohttp.ClientSession() as session:
            async with session.get(SEARCH_URL, params=BASE_QUERY_SEARCH + [('q', "She")]) as response:
                json_data = await response.json()
                print(json_data)


    loop = asyncio.get_event_loop()
    loop.run_until_complete(foo())
