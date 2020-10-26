export default function searchIdResultProcessor(ws, { items }, [room, setRoom]) {
    const newMap = new Map(room.videoInfoMap);
    for (const { id: code, snippet } of items) {
        newMap.set(code, snippet);
    }
    setRoom({...room, videoInfoMap: newMap});
}
