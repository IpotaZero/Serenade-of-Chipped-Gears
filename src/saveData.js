const SaveData = class {
    static default = () => new SaveData("train", "電車", 0, vec(7, 4), [])

    constructor(mapId, mapName, playTime, position, goods) {
        this.mapId = mapId
        this.mapName = mapName
        this.playTime = playTime
        this.position = position
        this.goods = goods
    }
}
