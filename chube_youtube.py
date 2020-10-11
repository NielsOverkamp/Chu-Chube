import asyncio
import os

import aiohttp

from chube_enums import Message
from chube_ws import Resolver, make_message, make_message_from_json_string

API_KEY = os.environ.get('GOOGLE_SEARCH_API_KEY')

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
SEARCH_PARAM = [('part', 'snippet'), ('type', 'video,playlist'), ('safeSearch', 'none'),
                ('key', API_KEY)]

ID_SEARCH_URL = "https://www.googleapis.com/youtube/v3/videos"
ID_SEARCH_PARAM = [('part', 'snippet'), ('key', API_KEY)]

GET_PLAYLIST_URL = "https://www.googleapis.com/youtube/v3/playlists"
GET_PLAYLIST_COUNT_PARAM = [('part', 'contentDetails'), ('key', API_KEY)]

GET_PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
GET_PLAYLIST_ITEMS_PARAM = [('part', 'snippet'),('maxResults', '1'), ('key', API_KEY)]


async def search_processor(ws, data, path):
    async with aiohttp.ClientSession() as session:
        async with session.get(SEARCH_URL, params=SEARCH_PARAM + [('q', data['q'])]) as response:
            data = await response.content.read(-1)
            await ws.send(make_message_from_json_string(Message.SEARCH, data.decode(response.get_encoding())))


async def search_id_processor(ws, data, path):
    ids = data["id"]
    if not isinstance(ids, list):
        ids = {ids}
    else:
        ids = set(ids)
    async with aiohttp.ClientSession() as session:
        async with session.get(ID_SEARCH_URL, params=ID_SEARCH_PARAM + [('id', ",".join(ids))]) as response:
            data = await response.content.read(-1)
            await ws.send(make_message_from_json_string(Message.SEARCH_ID, data.decode(response.get_encoding())))


async def get_all_playlist_items(playlistId):
    async with aiohttp.ClientSession() as session:
        async with session.get(GET_PLAYLIST_URL, params=GET_PLAYLIST_COUNT_PARAM + [('id', playlistId)]) as count_response:
            json_data = await count_response.json()
            item_count = json_data['items'][0]['contentDetails']['itemCount']
            items_params = GET_PLAYLIST_ITEMS_PARAM + [('playlistId', playlistId), ('maxResults', item_count)]
            async with session.get(GET_PLAYLIST_ITEMS_URL, params=items_params) as items_response:
                return await items_response.json()

    

def make_resolver():
    resolver = Resolver()
    resolver.register(Message.SEARCH, search_processor)
    resolver.register(Message.SEARCH_ID, search_id_processor)
    return resolver


if __name__ == "__main__":
    async def foo():
        async with aiohttp.ClientSession() as session:
            async with session.get(SEARCH_URL, params=SEARCH_PARAM + [('q', "She")]) as response:
                json_data = await response.json()
                print(json_data)


    loop = asyncio.get_event_loop()
    loop.run_until_complete(foo())
