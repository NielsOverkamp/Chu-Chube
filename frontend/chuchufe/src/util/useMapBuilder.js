
export default function MapBuilder(map, setMap) {
    const newMap = new Map(map);

    function addToMap(key, value) {
        newMap.set(key, value);
    }

    function update() {
        setMap(newMap);
    }

    function addToMapSave(key, value) {
        console.log(key, value)
        addToMap(key, value)
        update()
    }

    function addMultipleToMapSave(items) {
        for (const [key, value] of items) {
            addToMap(key, value)
        }
        update();
    }

    return {addToMap, update, addToMapSave, addMultipleToMapSave}
}