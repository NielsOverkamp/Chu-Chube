import { makeMessage, Resolver } from './websocketResolver.js';
import { ListOperationTypes, MediaAction, MessageTypes, PlayerState, YoutubeResourceType } from "./enums.js";

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady

const youtubeApiScript = document.createElement('script');

youtubeApiScript.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(youtubeApiScript, firstScriptTag);


const RTT_ESTIMATE = 1
const ALLOWED_AHEAD = 5

const PLAYER_WIDTH = 640
const PLAYER_HEIGHT = 360

let videos = null;
let videosPlayed = null;

let videoPlaying = null;
let state = null;

let isLeader = null;

let repeat = false;

let player = null;
let playerActive = false;
document.getElementById('player').append(mockPlayer('360', '640'));

const codeInfoMap = new Map()

function onYouTubeIframeAPIReady() {
    onYTDone();
}


function onPlayerReady(event) {
    event.target.seekTo(0);
    if (state === PlayerState.PLAYING) {
        event.target.playVideo();
    }
}

function onPlayerStateChange(event) {
    console.log(event.data, YT.PlayerState, state, videoPlaying, videos);
    if (event.data === 0 /*Ended*/) {
        if (state !== PlayerState.PLAYING) {
            console.warn("Player ended up in state ENDED while it is was not playing.")
            return
        }
        if (isLeader && videoPlaying !== null) {
            socket.send(makeMessage(MessageTypes.SONG_END, { id: videoPlaying.id }))
        }
        const vid = popVideo()
        if (vid !== undefined) {
            playVideo(vid);
        } else {
            videoPlaying = null;
            state = PlayerState.LIST_END;
        }
    }
}

function onAddVideo() {
    console.log(state, videoPlaying, videos)
    switch (state) {
        case PlayerState.LIST_END:
            if (videoPlaying === null) {
                playVideo(popVideo());
            } else {
                console.error(`Invalid state: state=${state}; videoPlaying=${videoPlaying}`)
                return
            }
            break
        case PlayerState.PAUSED:
            if (videoPlaying === null) {
                loadVideo(popVideo())
            }
            break
        case PlayerState.PLAYING:
            if (videoPlaying === null) {
                playVideo(popVideo())
            }
            break
        default:
            console.error("Unknown state", state)
            break
    }
}

function addVideo(code, id) {
    videos.push({ code, id });
    makeQueueLine(code, id);
    onAddVideo();
}

function popVideo() {
    console.log("pop", videos)
    if (videos.length <= 0) {
        if (videosPlayed) {
            videos = []
            for (const { code, id } of videosPlayed) {
                videos.push({code, id});
                makeQueueLine(code, id);
            }
            videosPlayed = []
        } else {
            state = PlayerState.LIST_END
            return undefined;
        }
    }
    const vid = videos.shift();
    queueElement.removeChild(queueElement.querySelector(".videoListCard"));
    if (videosPlayed) {
        videosPlayed.push(vid);
    }
    return vid;
}

function findVideoIndex(id) {
    return videos.findIndex(function (vid) {
        return vid.id === id
    })
}

function delVideo(id) {
    videos.splice(findVideoIndex(id), 1)
    removeQueueLine(id)
}

function moveVideo(id, displacement) {
    const i = findVideoIndex(id)
    const [vid] = videos.splice(i, 1)

    const new_i = i + displacement
    videos.splice(new_i, 0, vid)
    removeQueueLine(id)

    if (new_i + 1 === videos.length) {
        makeQueueLine(vid.code, id)
    } else {
        console.log(videos, new_i)
        makeQueueLine(vid.code, id, videos[new_i + 1].id)
    }

}

function playVideo(vid) {
    videoPlaying = vid;
    state = PlayerState.PLAYING

    if (!playerActive) {
        return;
    }

    if (player === null) {
        buildPlayer(PLAYER_HEIGHT, PLAYER_WIDTH, vid.code);
    } else {
        player.loadVideoById(vid.code, 0);
    }
}

function loadVideo(vid) {
    videoPlaying = vid;

    if (!playerActive) {
        return
    }

    if (player === null) {
        buildPlayer(PLAYER_WIDTH, PLAYER_HEIGHT, vid.code);
    } else {
        player.cueVideoById(vid.code, 0);
    }
}

function setLeader(b) {
    console.log(isLeader, b)
    if (isLeader !== b) {
        let btn = document.getElementById("leader-button");
        btn.innerText = b ? "Leader" : "Follower";
        btn.classList.remove(b ? "btn-outline-success" : "btn-success")
        btn.classList.add(b ? "btn-success" : "btn-outline-success")
        if (isLeader === null) {
            btn.classList.remove("disabled", "btn-outline-secondary")
        }
        isLeader = b;

    //    TEMPORARY HACK CODE
        if (!isLeader) {
            playerContainer.setAttribute("hidden", true)
            playerContainer.children[0].setAttribute("hidden", true)
            queueElement.setAttribute("hidden" ,true)
            document.getElementById("searchVideoForm").setAttribute("hidden", true)
            document.getElementById("clearAllButton").setAttribute("hidden", true)
        } else {
            playerContainer.removeAttribute("hidden")
            playerContainer.children[0].removeAttribute("hidden")
            queueElement.removeAttribute("hidden")
            document.getElementById("searchVideoForm").removeAttribute("hidden")
            document.getElementById("clearAllButton").removeAttribute("hidden")
        }
    }
}

window.setLeader = setLeader

function mockPlayer(height, width) {
    const rect = document.createElement('div');
    rect.setAttribute('style', `height:${height}px;width:${width}px;background:black`);
    return rect
}

function buildPlayer(height, width, id) {
    player = new YT.Player('player', {
        height: height + 48,
        width: width,
        videoId: id,
        playerVars: {},
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
        }
    });
    window.player = player
}

const queueElement = document.getElementById('videoList')
const queueLine = document.getElementById('videoListCardTemplate')

function makeQueueLine(code, id, before_id) {
    let newQueueLine = queueLine.cloneNode(true);
    newQueueLine.id = "";
    newQueueLine.hidden = false;
    newQueueLine.setAttribute("data-id", id)
    if (codeInfoMap.has(code)) {
        const { thumbnails, title, channelTitle, publishTime, description } = codeInfoMap.get(code)

        const thumbnail = newQueueLine.getElementsByClassName("videoListCardThumbnail")[0]
        const img = document.createElement('img')
        thumbnail.appendChild(img)
        img.setAttribute('src', thumbnails.default.url)
        img.setAttribute('width', thumbnails.default.width)
        img.setAttribute('height', thumbnails.default.height)
        img.setAttribute('alt', "")

        newQueueLine.getElementsByClassName("videoListCardTitle")[0].innerText = title
        newQueueLine.getElementsByClassName("videoListCardChannel")[0].innerText = channelTitle
        newQueueLine.getElementsByClassName("videoListCardDescription")[0].innerText = description.replace(/\n/g, " ")
    }

    newQueueLine.setAttribute("data-youtubeId", code)

    function delHandler(event) {
        onDeleteClick(event, id)
    }

    const delButton = newQueueLine.querySelector('.videoListCardDelete')
    delButton.addEventListener("click", delHandler)
    delButton.addEventListener("keydown", delHandler)

    function moveUpHandler(event) {
        onMoveClick(event, id, -1)
    }

    const upButton = newQueueLine.querySelector('.videoListCardMoveUp')
    upButton.addEventListener("click", moveUpHandler)
    upButton.addEventListener("keydown", moveUpHandler)

    function moveDownHandler(event) {
        onMoveClick(event, id, 1)
    }

    const downButton = newQueueLine.querySelector('.videoListCardMoveDown')
    downButton.addEventListener("click", moveDownHandler)
    downButton.addEventListener("keydown", moveDownHandler)

    if (before_id == null) {
        queueLine.before(newQueueLine);
    } else {
        queueElement.querySelector(`[data-id='${before_id}']`).before(newQueueLine)
    }
}

function removeQueueLine(id) {
    const card = queueElement.querySelector(`div[data-id='${id}']`);
    queueElement.removeChild(card);
}

function onSubmit(event) {
    event.preventDefault();
    socket.send(makeMessage(MessageTypes.LIST_OPERATION, {
        op: ListOperationTypes.ADD,
        code: event.target[0].value
    }))
}

function onSearch(event) {
    event.preventDefault();
    const q = event.target[0].value
    if (q !== "") {
        socket.send(makeMessage(MessageTypes.SEARCH, { q }))
    }
}

function onDeleteClick(event, id) {
    event.preventDefault();
    socket.send(makeMessage(MessageTypes.LIST_OPERATION, { op: ListOperationTypes.DEL, id }))
}

function onMoveClick(event, id, displacement) {
    event.preventDefault();
    socket.send(makeMessage(MessageTypes.LIST_OPERATION, { op: ListOperationTypes.MOVE, id, displacement }))
}

function onLeaderbutton(event) {
    if (isLeader) {
        socket.send(makeMessage(MessageTypes.RELEASE_CONTROL))
    } else {
        socket.send(makeMessage(MessageTypes.OBTAIN_CONTROL))
    }
}

const playerPlaceholder = document.getElementById('playerPlaceholder');
const playerPlaceholderParent = playerPlaceholder.parentElement;

const playerContainer = document.getElementById('playerContainer')

const showPlaceholderButton = document.getElementById('showPlayerPlaceholder');

function onPlayerStart(event) {
    event.preventDefault();
    playerActive = true;
    playerPlaceholderParent.removeChild(playerPlaceholder)
    document.getElementById("playerPlaceholder2").removeAttribute('hidden')
    // if (!isLeader) {
    //     playerContainer.children[0].setAttribute("hidden", true)
    //     playerContainer.setAttribute("hidden", true)
    // } else {
    //     playerContainer.children[0].removeAttribute("hidden")
    //     playerContainer.removeAttribute("hidden")
    // }
    switch (state) {
        case PlayerState.LIST_END:
            break;
        case PlayerState.PAUSED:
            if (videoPlaying !== null) {
                loadVideo(videoPlaying);
            } else {
                console.error(`Invalid state: state=${state}; videoPlaying=${videoPlaying}`)
                return
            }
            break;
        case PlayerState.PLAYING:
            if (videoPlaying !== null) {
                playVideo(videoPlaying);
            } else {
                console.error(`Invalid state: state=${state}; videoPlaying=${videoPlaying}`)
                return
            }
            break;
    }
    socket.send(makeMessage(MessageTypes.PLAYER_ENABLED, { enabled: true }))
}

function onPlayerClose(event) {
    event.preventDefault();
    playerActive = false;
    playerContainer.toggleAttribute("hidden")
    playerPlaceholderParent.appendChild(playerPlaceholder)
    if (player !== null) {
        player.pauseVideo();
    }
    socket.send(makeMessage(MessageTypes.PLAYER_ENABLED, { enabled: false }))
}

function hidePlayerPlaceholder(event) {
    event.preventDefault();
    playerPlaceholderParent.removeChild(playerPlaceholder);
    showPlaceholderButton.toggleAttribute("hidden")
}

function showPlayerPlaceholder(event) {
    event.preventDefault();
    playerPlaceholderParent.appendChild(playerPlaceholder);
    showPlaceholderButton.toggleAttribute("hidden")
}

function onPlayButton(event) {
    event.preventDefault();
    socket.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.PLAY }))
}

function onPauseButton(event) {
    event.preventDefault();
    socket.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.PAUSE }))

}

function onNextButton(event) {
    event.preventDefault();
    if (videoPlaying !== null) {
        socket.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.NEXT, current_id: videoPlaying.id }))
    }
}

const repeatButton = document.getElementById('repeat-button');

function onRepeatButton(event) {
    event.preventDefault();
    socket.send(makeMessage(MessageTypes.MEDIA_ACTION, { action: MediaAction.REPEAT, enable: !repeat }))
}

function onClearAllButton(event){
    event.preventDefault()
    socket.send(makeMessage(MessageTypes.LIST_OPERATION, { op: ListOperationTypes.CLEAR }))
}

function stateProcessor(ws, data) {
    const { playing, state: newState, lists } = data;
    const { next, previous } = lists

    videos = []
    videosPlayed = previous
    repeat = !!previous
    state = newState
    videoPlaying = playing

    const codes = []
    for (const song of next) {
        const { code, id } = song
        addVideo(code, id)
        if (!(codes.includes(code))) {
            codes.push(code)
        }
    }

    for (const song of previous || []) {
        const { code, id } = song;
        if (!(codes.includes(code))) {
            codes.push(code)
        }
    }

    if (codes.length > 0) {
        socket.send(makeMessage(MessageTypes.SEARCH_ID, { id: codes }))
    }

    if (videoPlaying !== null) {
        if (state === PlayerState.PLAYING) {
            playVideo(videoPlaying)
        } else {
            loadVideo(videoPlaying)
        }
    }
    if (isLeader === null) {
        setLeader(false)
    }
    if (repeat) {
        repeatButton.classList.toggle('btn-outline-secondary');
        repeatButton.classList.toggle('btn-secondary');
    }
    afterStateInit()
}

function listOperationProcessor(ws, data) {
    const { op, items } = data;
    if (op === ListOperationTypes.ADD) {
        const noCodeInfo = []
        for (const { code, id, snippet } of items) {
            if (snippet !== undefined) {
                codeInfoMap.set(code, snippet)
            } else if (!codeInfoMap.has(code)) {
                noCodeInfo.push(code)
            }
            addVideo(code, id);
        }
        if (noCodeInfo.length > 0) {
            socket.send(makeMessage(MessageTypes.SEARCH_ID, { id: noCodeInfo.join(',') }))
        }
    } else if (op === ListOperationTypes.DEL) {
        for (const { id } of items) {
            delVideo(id);
        }
    } else if (op === ListOperationTypes.MOVE) {
        for (const { id, displacement } of items) {
            moveVideo(id, displacement)
        }
    } else if (op === ListOperationTypes.CLEAR) {
        videos = []
        if (videosPlayed) {
            videosPlayed = []
        }
        queueElement.innerHTML = ''
        queueElement.appendChild(queueLine)
    }
}

function mediaActionProcessor(ws, data) {
    const { action, ended_id, current_id, enable } = data;
    if (action === MediaAction.PLAY && state === PlayerState.PAUSED) {
        state = PlayerState.PLAYING
        player.playVideo();
    } else if (action === MediaAction.PAUSE && state === PlayerState.PLAYING) {
        state = PlayerState.PAUSED
        player.pauseVideo();
    } else if (action === MediaAction.NEXT) {
        if (videoPlaying !== null && videoPlaying.id === ended_id)  {
            const vid = popVideo()
            if (vid !== undefined) {
                playVideo(vid)
            } else {
                videoPlaying = null;
                state = PlayerState.LIST_END;
                if (player) {
                    player.stopVideo();
                }
            }
        }
    } else if (action === MediaAction.REPEAT) {
        if (enable !== repeat) {
            repeat = enable;
            repeatButton.classList.toggle('btn-outline-secondary');
            repeatButton.classList.toggle('btn-secondary');
            videosPlayed = repeat ? (videoPlaying ? [videoPlaying] : []) : null;
        }
    }
}

function songEndProcessor(ws, data) {
    const { ended_id, current_id } = data;
    console.log(ended_id, current_id)
    if (videoPlaying === null) {
        // Do nothing
    } else if (ended_id === videoPlaying.id) {
        const vid = popVideo()
        console.log(vid)
        if (vid !== undefined) {
            playVideo(vid);
        } else {
            videoPlaying = null;
            state = PlayerState.LIST_END
            // TODO SEEK TO END
        }
    } else if (current_id === videoPlaying.id) {
        if (!isLeader && player.getCurrentTime() - RTT_ESTIMATE - ALLOWED_AHEAD > 0) {
            player.seekTo(RTT_ESTIMATE + ALLOWED_AHEAD, true)
        }
    } else {
        console.error("Difficult state reached. Reset protocol not implemented. Either to far ahead, behind or state inconsistency", ended_id, current_id, videoPlaying)
    }
}


const searchResultTemplate = document.getElementById("searchResultTemplate")
const searchResultList = searchResultTemplate.parentElement
searchResultList.removeChild(searchResultTemplate)
searchResultTemplate.id = ""

function makeSearchResult(item) {
    const { id, snippet } = item
    const { kind, videoId, channelId, playlistId } = id
    const { thumbnails, title, channelTitle, publishTime, description } = snippet

    const code = kind === YoutubeResourceType.CHANNEL ? channelId :
        kind === YoutubeResourceType.PLAYLIST ? playlistId :
            kind === YoutubeResourceType.VIDEO ? videoId :
                console.error(`Unknown kind ${kind}`)

    if (!code) return;

    const searchResult = searchResultTemplate.cloneNode(true)
    searchResult.setAttribute('data-youtubeID', code)


    function onClickHandler() {
        socket.send(makeMessage(MessageTypes.LIST_OPERATION, {
            op: ListOperationTypes.ADD,
            kind,
            code
        }));
        if (kind === YoutubeResourceType.VIDEO) {
            codeInfoMap.set(videoId, snippet)
        }
    }

    searchResult.addEventListener("click", onClickHandler)
    searchResult.addEventListener("keydown", onClickHandler)

    const thumbnailContainer = searchResult.getElementsByClassName("searchResultThumbnail")[0]
    const thumbnailImage = thumbnailContainer.getElementsByClassName("thumbnailImage")[0]
    const img = document.createElement('img')
    thumbnailImage.appendChild(img)

    const { url, width, height } = (thumbnails ? thumbnails["default"] : {
        url: "/img/no_thumbnail.png",
        width: 120,
        height: 90
    })

    img.setAttribute('src', url)
    img.setAttribute('width', width)
    img.setAttribute('height', height)
    img.setAttribute('alt', "")

    if (kind !== YoutubeResourceType.PLAYLIST) {
        const playlistOverlay = thumbnailContainer.getElementsByClassName("thumbnailPlaylistOverlay")[0]
        playlistOverlay.parentElement.removeChild(playlistOverlay);
    }

    searchResult.getElementsByClassName("searchResultTitle")[0].innerText = title
    searchResult.getElementsByClassName("searchResultChannel")[0].innerText = channelTitle
    searchResult.getElementsByClassName("searchResultDescription")[0].innerText = description
    searchResult.removeAttribute('hidden')

    searchResultList.appendChild(searchResult)
}

function searchResultProcessor(_, data) {
    const { items } = data;
    searchResultList.innerHTML = '';
    for (const item of items) {
        makeSearchResult(item)
    }
}

function searchIdResultProcessor(_, data) {
    const { items } = data;
    for (const { id: code, snippet } of items) {
        codeInfoMap.set(code, snippet);
        const lines = queueElement.querySelectorAll(`[data-youtubeID='${code}`)
        for (const line of lines) {
            if (line !== null) {
                const id = parseInt(line.getAttribute("data-id"))
                makeQueueLine(code, id, id)
                line.parentElement.removeChild(line)
            }
        }
    }
}

let socket;

function onYTDone() {
    const resolver = new Resolver()
    resolver.register(MessageTypes.STATE, stateProcessor)
    resolver.register(MessageTypes.LIST_OPERATION, listOperationProcessor)
    resolver.register(MessageTypes.MEDIA_ACTION, mediaActionProcessor)
    resolver.register(MessageTypes.OBTAIN_CONTROL, () => setLeader(true))
    resolver.register(MessageTypes.RELEASE_CONTROL, () => setLeader(false))
    resolver.register(MessageTypes.SONG_END, songEndProcessor)
    resolver.register(MessageTypes.SEARCH, searchResultProcessor)
    resolver.register(MessageTypes.SEARCH_ID, searchIdResultProcessor)
    socket = resolver.connectSocket()
    socket.addEventListener("open", function () {
        socket.send(makeMessage(MessageTypes.STATE, null))
    })
}

function afterStateInit() {
    // document.getElementById('addVideoForm').addEventListener('submit', onSubmit);
    document.getElementById('searchVideoForm').addEventListener('submit', onSearch)
    document.getElementById('leader-button').addEventListener('click', onLeaderbutton)
    document.getElementById('startPlayerButton').addEventListener('click', onPlayerStart)
    document.getElementById('closePlayer').addEventListener('click', onPlayerClose)
    document.getElementById('hidePlayerPlaceholder').addEventListener('click', hidePlayerPlaceholder)
    document.getElementById('showPlayerPlaceholder').addEventListener('click', showPlayerPlaceholder)
    document.getElementById('play-button').addEventListener('click', onPlayButton)
    document.getElementById('pause-button').addEventListener('click', onPauseButton)
    document.getElementById('next-button').addEventListener('click', onNextButton)
    document.getElementById('repeat-button').addEventListener('click', onRepeatButton)
    document.getElementById('clearAllButton').addEventListener('click', onClearAllButton)
}
