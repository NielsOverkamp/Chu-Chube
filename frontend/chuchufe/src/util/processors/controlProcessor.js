
export default function controlProcessor(ws, data, [{ controller, ...rest }, setRoom]) {
    const {obtain} = data;
    const {isMe} = controller;
    if (obtain !== isMe) {
        setRoom({
            controller: {...controller, isMe: obtain},
            ...rest
        })
    }
}
