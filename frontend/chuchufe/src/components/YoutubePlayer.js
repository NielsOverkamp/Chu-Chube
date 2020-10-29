import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlayerState, YoutubePlayerState } from "../util/enums";
import LoadingLogo from "./LoadingLogo";

export default function YoutubePlayer({ playback, onSongEnd }) {
    const { song, state } = playback;
    const id = useMemo(() => `youtube-player-${Math.floor(1e15 * Math.random())}`, []);
    const player = useRef(null)
    const [iframeAPILoading, setIframeAPILoading] = useState(false);
    const [playerConnected, setPlayerConnected] = useState(false)
    const [previousState, setPreviousState] = useState(state)
    const [iframeSong, setIframeSong] = useState(null);


    useEffect(() => {
        console.log({ playerConnected, song, iframeSong, state, previousState })
        if (playerConnected) {
            if (song !== null) {
                if (previousState !== state && iframeSong !== null) {
                    switch (state) {
                        case PlayerState.PLAYING:
                            if (previousState !== PlayerState.PLAYING) {
                                player.current.playVideo();
                            }
                            break;
                        case PlayerState.PAUSED:
                            if (previousState !== PlayerState.PAUSED) {
                                player.current.pauseVideo();
                            }
                            break;
                        case PlayerState.LIST_END:
                            // Soon to be deprecated
                            if (previousState !== PlayerState.LIST_END) {
                                player.current.stopVideo();
                            }
                            break;
                        default:
                            console.warn("Uknown PlayerState: ", state)
                    }
                    setPreviousState(state);
                }
                if (iframeSong === null || iframeSong.id !== song.id) {
                    switch (state) {
                        case PlayerState.PLAYING:
                            player.current.loadVideoById(song.code);
                            setIframeSong(song);
                            break;
                        case PlayerState.PAUSED:
                            player.current.cueVideoById(song.code);
                            setIframeSong(song);
                            break
                        case PlayerState.LIST_END:
                            player.current.stopVideo();
                            console.warn("Anomalous state reached:", {
                                song,
                                iframeSong,
                                state,
                                iframeState: previousState
                            })
                            setIframeSong(null);
                            break;
                        default:
                            console.warn("Uknown PlayerState: ", state)
                    }
                }

            } else {
                if (iframeSong !== null) {
                    player.current.stopVideo();
                    setIframeSong(null);
                    setPreviousState(state);
                }
            }
        }
    }, [state, previousState, song, iframeSong, playerConnected])

    useEffect(() => {
        if (!playerConnected) {
            function onYTIAPIReady() {
                player.current = new window.YT.Player(id, {
                    // height: PLAYER_HEIGHT + 48,
                    // width: PLAYER_WIDTH,
                    videoId: undefined,
                    playerVars: {
                        "origin": window.location.origin,
                        "autoplay": 1
                    },
                    events: {
                        'onReady': () => {
                            setPlayerConnected(true);
                            setIframeAPILoading(false);
                        }
                    }
                })
                console.log("Player preparing");
            }

            window.onYouTubeIframeAPIReady = onYTIAPIReady;

            if (!iframeAPILoading) {
                if (!window.YT) {
                    setIframeAPILoading(true);
                    const tag = document.createElement('script');
                    // tag.src = 'https://www.youtube.com/iframe_api';
                    const firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                } else {
                    window.onYouTubeIframeAPIReady()
                }
            }
        }
    }, [id, iframeAPILoading, playerConnected]);

    useEffect(() => {
        if (playerConnected) {
            function onPlayerStateChange(event) {
                if (event.data === YoutubePlayerState.ENDED) {
                    onSongEnd();
                }
            }

            const currentPlayer = player.current
            currentPlayer.addEventListener("onStateChange", onPlayerStateChange)
            return () => currentPlayer.removeEventListener("onStateChange", onPlayerStateChange)
        }
    }, [onSongEnd, playerConnected])

    return <div className="col-12">
        <div className="playerContainer" hidden={!playerConnected || song === null}>
            <div id={id}/>
        </div>
        {song === null && <div className="playerContainer" style={{ textAlign: "center" }}>
            <div className="d-flex justify-content-center playerPlaceholder">
                <h5 className="text-secondary pt-2">Use the search to add a song to the queue</h5>
            </div>
        </div>}
        {song !== null && !playerConnected && <div className="playerContainer">
            <div style={{ paddingTop: "14%" }}>
                <LoadingLogo/>
            </div>
        </div>
        }
    </div>
}
