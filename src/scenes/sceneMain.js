const displayMapWidth = 18
const gridSize = width / displayMapWidth

const sceneMain = new (class {
    #frame
    #mode
    #player
    #background
    #map
    #unWalkableGrid
    #mapData
    #mapId

    constructor() {
        this.#mapId = "test"

        this.#unWalkableGrid = new Set()

        this.#player = {
            p: vec(0, 0),
            displayP: vec(0, 0),
            previousP: vec(0, 0),
            direction: "down",
            moveIntervalCount: 0,
            moveInterval: 10,
            walkCount: 0,
            image: {
                up: [
                    new Iimage("images/sprites/taro.png", 48, 0, 16, 32),
                    new Iimage("images/sprites/taro.png", 64, 0, 16, 32),
                    new Iimage("images/sprites/taro.png", 80, 0, 16, 32),
                ],
                down: [
                    new Iimage("images/sprites/taro.png", 0, 0, 16, 32),
                    new Iimage("images/sprites/taro.png", 16, 0, 16, 32),
                    new Iimage("images/sprites/taro.png", 32, 0, 16, 32),
                ],
                left: [
                    new Iimage("images/sprites/taro.png", 0, 32, 16, 32),
                    new Iimage("images/sprites/taro.png", 16, 32, 16, 32),
                    new Iimage("images/sprites/taro.png", 32, 32, 16, 32),
                ],
                right: [
                    new Iimage("images/sprites/taro.png", 48, 32, 16, 32),
                    new Iimage("images/sprites/taro.png", 64, 32, 16, 32),
                    new Iimage("images/sprites/taro.png", 80, 32, 16, 32),
                ],
            },
            exclamation: new Iimage("images/exclamation.png"),
        }

        this.#frame = 0

        this.#mode = "move"
    }

    loadSaveData(savedata) {
        this.#mapId = savedata.mapId
        this.#player.p = vec(savedata.position.x, savedata.position.y)
        playTimeHandler.initialize(savedata.playTime)
    }

    async start() {
        this.#mode = "loading"

        await loadScript(`mapData/${this.#mapId}.mapdata`)

        this.#mapData = mapData

        this.#map = this.#generateMap(mapData)

        const spriteImageLoadPromise = Promise.all(this.#map.sprites.filter((s) => s.image).map((s) => s.image.loaded))

        this.#unWalkableGrid.clear()

        const drawBackgroundPromise = this.#drawBackground()

        drawHandler.lightColour = mapData.lightColour

        await Promise.all([spriteImageLoadPromise, drawBackgroundPromise])

        this.#mode = "move"
    }

    #generateMap(mapData) {
        const dataLength = mapData.width * mapData.height
        const trimmedGrid = mapData.grid.replaceAll(/ |\n/g, "")
        const filledGrid = (trimmedGrid + "00".repeat(dataLength)).slice(0, dataLength * 2)

        mapData.grid = filledGrid

        const map = {
            width: mapData.width,
            height: mapData.height,
            grid: filledGrid,
            sprites: mapData.sprites.map((spriteData) => this.#generateSprite(...spriteData)),
        }

        return map
    }

    #generateSprite(type, position, args) {
        const walkableType = ["move"]

        const sprite = {
            type: type,
            x: position[0],
            y: position[1],
            walkable: walkableType.includes(type),
            size: [1, 1],
            direction: "down",
            ...args,
        }

        if (args.image) {
            sprite.image = {}

            for (const direction in args.image) {
                const imageId = args.image[direction].join()

                if (!spriteImageCache.has(imageId)) {
                    spriteImageCache.set(imageId, new Iimage(...args.image[direction]))
                }

                sprite.image[direction] = spriteImageCache.get(imageId)
            }
        }

        return sprite
    }

    async #forDebugFetchTileImage() {
        for (const tileId in mapTile) {
            let [path, option] = mapTile[tileId].split("/")
            if (path[0] == "!") {
                path = path.substring(1)
            }
            const image = new Iimage(`images/mapTiles/${path}.png`, ...(option ?? "0,0").split(","), 16, 16)
            await image.loaded

            tileImageCache.set(tileId, image)
        }
    }

    async #drawBackground() {
        await this.#forDebugFetchTileImage()

        this.#background = document.createElement("canvas")
        const [column, row] = [this.#map.width, this.#map.height]

        this.#background.width = gridSize * column
        this.#background.height = gridSize * row
        const ctx = this.#background.getContext("2d")

        ctx.imageSmoothingEnabled = false

        const grid = this.#map.grid.replaceAll(/ |\n/g, "")

        await ILoopAsync([0, 0], [column - 1, row - 1], async (x, y) => {
            const tileId = grid.slice(2 * (x + column * y), 2 * (x + column * y) + 2)

            // 知られざるtileId
            if (!(tileId in mapTile)) return

            let [path, option] = mapTile[tileId].split("/")
            if (path[0] == "!") {
                path = path.substring(1)
                this.#unWalkableGrid.add(`${x},${y}`)
            }

            if (!tileImageCache.has(tileId)) {
                const image = new Iimage(`images/mapTiles/${path}.png`, ...(option ?? "0,0").split(","), 16, 16)
                await image.loaded

                tileImageCache.set(tileId, image)
            }

            const tileImage = tileImageCache.get(tileId)

            tileImage.draw(ctx, [gridSize * x, gridSize * y], [gridSize, gridSize])
            // Irect(ctx, "azure", [gridSize * x, gridSize * y], [gridSize, gridSize], {
            //     lineWidth: 2,
            // })
        })
    }

    loop() {
        playTimeHandler.observeFocusState()

        if (!focusState.isFocused) return

        switch (this.#mode) {
            case "loading": {
                this.#modeLoading()
                break
            }
            case "move": {
                this.#modeMove()
                break
            }
            case "menu": {
                this.#modeMenu()
                break
            }
            case "event": {
                this.#modeEvent()
                break
            }
            case "edit": {
                this.#modeEdit()
                break
            }
        }

        this.#frame++
    }

    #modeLoading() {
        Irect(ctxMain, "#111", [0, 0], [width, height])
        Itext(ctxMain, "azure", "dot", 48, [20, 20], "なうろーでぃんぐ...")
    }

    #modeMove() {
        if (keyboard.pushed.has("cancel")) {
            this.#mode = "menu"
            modeMenu.start()
        } else if (keyboard.pushed.has("KeyC")) {
            this.#mode = "edit"
            this.#gotoEdit()
        }

        this.#controlPlayer()
        this.#draw()

        // 移動が終わったら、スプライトの効果を
        const gap = this.#player.p.sub(this.#player.displayP)
        const isEndPlayerMove = gap.length() < 0.1
        if (!isEndPlayerMove) return
        this.#resolveSpriteAction()
    }

    #gotoEdit() {
        modeEdit.start({
            gridSize: gridSize,
            mapData: this.#mapData,
            playerP: this.#player.p,
            background: this.#background,
            unWalkableGrid: this.#unWalkableGrid,
        })
    }

    #draw() {
        drawHandler.loop({ player: this.#player, background: this.#background, map: this.#map })
    }

    #updateCameraState() {
        Icamera.p = this.#player.displayP.add(vec(0.5, 0.5)).mlt(gridSize)

        if (Icamera.p.x < width / 2) Icamera.p.x = width / 2
        if (Icamera.p.y < height / 2) Icamera.p.y = height / 2
        if (Icamera.p.x > gridSize * this.#map.width - width / 2) Icamera.p.x = gridSize * this.#map.width - width / 2
        if (Icamera.p.y > gridSize * this.#map.height - height / 2)
            Icamera.p.y = gridSize * this.#map.height - height / 2

        if (displayMapWidth > this.#map.width) {
            Icamera.p.x = width / 2 - ((displayMapWidth - this.#mapData.width) * gridSize) / 2
        }

        if (displayMapWidth * (3 / 4) > this.#map.height) {
            Icamera.p.y = height / 2 - ((displayMapWidth * (3 / 4) - this.#mapData.height) * gridSize) / 2
        }
    }

    #controlPlayer() {
        const interval = this.#player.isDash ? this.#player.moveInterval / 2 : this.#player.moveInterval

        this.#player.displayP = this.#player.previousP.add(
            this.#player.p.sub(this.#player.previousP).mlt(1 - this.#player.moveIntervalCount / interval),
        )

        this.#updateCameraState()

        if (this.#player.moveIntervalCount > 0) {
            this.#player.moveIntervalCount--
            return
        }

        const v = vec(0, 0)

        if (keyboard.pressed.has("ArrowRight")) {
            this.#player.direction = "right"
            v.x += 1
        } else if (keyboard.pressed.has("ArrowLeft")) {
            this.#player.direction = "left"
            v.x -= 1
        } else if (keyboard.pressed.has("ArrowUp")) {
            this.#player.direction = "up"
            v.y -= 1
        } else if (keyboard.pressed.has("ArrowDown")) {
            this.#player.direction = "down"
            v.y += 1
        }

        this.#player.isDash = false

        if (v.length() > 0) {
            if (keyboard.pressed.has("ShiftLeft")) this.#player.isDash = true

            // 目の前に壁となるスプライトがあるか?

            const unWalkableGrid = [...this.#unWalkableGrid]

            this.#map.sprites.forEach((sprite) => {
                if (sprite.walkable) return
                ILoop([1, 1], sprite.size, (x, y) => {
                    unWalkableGrid.push(`${sprite.x + x - 1},${sprite.y + y - 1}`)
                })
            })

            const nextPlayerP = this.#player.p.add(v)

            const walkable = !unWalkableGrid.includes(`${nextPlayerP.x},${nextPlayerP.y}`)

            if (walkable) {
                const interval = this.#player.isDash ? this.#player.moveInterval / 2 : this.#player.moveInterval

                this.#player.previousP = this.#player.p
                this.#player.p = this.#player.p.add(v)
                this.#player.moveIntervalCount = interval

                this.#player.walkCount++
            } else {
                this.#player.walkCount = 0
            }
        } else {
            this.#player.walkCount = 0
        }

        // 端
        if (this.#player.p.x < 0) this.#player.p.x = 0
        if (this.#player.p.y < 0) this.#player.p.y = 0
        if (this.#player.p.x > this.#map.width - 1) this.#player.p.x = this.#map.width - 1
        if (this.#player.p.y > this.#map.height - 1) this.#player.p.y = this.#map.height - 1
    }

    #resolveSpriteAction() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#map.sprites.forEach((sprite) => {
            const spriteGrid = []

            ILoop([1, 1], sprite.size, (x, y) => {
                spriteGrid.push(`${sprite.x + x - 1},${sprite.y + y - 1}`)
            })

            const isInArea = spriteGrid.includes(`${this.#player.p.x},${this.#player.p.y}`)

            const directionGrid = this.#player.p.add(
                {
                    right: vec(1, 0),
                    left: vec(-1, 0),
                    up: vec(0, -1),
                    down: vec(0, 1),
                }[this.#player.direction],
            )

            const isLooking = spriteGrid.includes(`${directionGrid.x},${directionGrid.y}`)

            switch (sprite.type) {
                case "move": {
                    if (isInArea && this.#player.direction == sprite.direction) {
                        changeScene(sceneMain, 1000)
                        this.#mapId = sprite.mapId
                        ;[this.#player.p.x, this.#player.p.y] = sprite.position
                        ;[this.#player.displayP.x, this.#player.displayP.y] = sprite.position
                        ;[this.#player.previousP.x, this.#player.previousP.y] = sprite.position
                        Icamera.p = this.#player.p.add(vec(0.5, 0.5)).mlt(gridSize)
                    }
                    break
                }
                case "talk": {
                    if (!isLooking) break

                    this.#player.exclamation.draw(
                        ctxMain,
                        [gridSize * this.#player.p.x, gridSize * (this.#player.p.y - 2)],
                        [gridSize, gridSize],
                    )

                    if (!keyboard.pushed.has("ok")) return

                    // playerの方を向く
                    const reverse = {
                        down: "up",
                        left: "right",
                        up: "down",
                        right: "left",
                    }[this.#player.direction]

                    if (sprite.image && reverse in sprite.image) {
                        sprite.direction = reverse
                    }

                    this.#mode = "event"
                    modeEvent.generator = sprite.event()
                    modeEvent.start()

                    break
                }
            }
        })

        ctxMain.restore()
    }

    #modeMenu() {
        this.#draw()

        const response = modeMenu.loop({
            mapName: this.#mapData.name,
            mapId: this.#mapData.id,
            playerP: this.#player.p,
            goods: [],
        })

        switch (response) {
            case "move": {
                this.#mode = "move"
                break
            }
            case "edit": {
                this.#mode = "edit"
                this.#gotoEdit()
                break
            }
        }
    }

    #modeEvent() {
        this.#draw()

        const isEnd = modeEvent.loop()

        if (isEnd) {
            this.#mode = "move"
        }
    }

    #modeEdit() {
        this.#draw()

        const response = modeEdit.loop()

        switch (response) {
            case "editEnd": {
                this.#mode = "move"
                this.#map.sprites = this.#mapData.sprites.map((s) => this.#generateSprite(...s))
                break
            }
        }
    }
})()

const drawHandler = class {
    static #gradient
    static lightColour = undefined

    static initialize() {
        this.#gradient = ctxMain.createLinearGradient(0, 0, 0, height)
        this.#gradient.addColorStop(0, "#FFD700") // 黄色
        this.#gradient.addColorStop(0.3, "#FF8C00") // オレンジ
        this.#gradient.addColorStop(0.6, "#FF4500") // 赤
        this.#gradient.addColorStop(0.9, "#8A2BE2") // 紫
        this.#gradient.addColorStop(1, "#000080") // 暗い青
    }

    static loop({ player, background, map }) {
        Irect(ctxMain, "#111", [0, 0], [width, height])

        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#drawMap(background)
        this.#drawSprites(map)
        this.#drawPlayer(player)

        ctxMain.restore()

        this.#addLightEffect()
    }

    static #addLightEffect() {
        if (!this.lightColour) return

        ctxMain.save()
        ctxMain.globalCompositeOperation = "multiply"
        Irect(ctxMain, this.lightColour, [0, 0], [width, height])
        // Irect(ctxMain, this.#gradient, [0, 0], [width, height])
        ctxMain.restore()
    }

    static #drawMap(background) {
        // background
        ctxMain.drawImage(background, 0, 0)
    }

    static #drawSprites(map) {
        // sprites
        map.sprites.forEach((sprite) => {
            if (sprite.image) {
                sprite.image[sprite.direction].draw(
                    ctxMain,
                    [gridSize * sprite.x, gridSize * sprite.y],
                    [gridSize * sprite.size[0], gridSize * sprite.size[1]],
                )
                return
            }

            ILoop([1, 1], sprite.size, (x, y) => {
                Irect(
                    ctxMain,
                    "#08f8",
                    [gridSize * (sprite.x + x - 1), gridSize * (sprite.y + y - 1)],
                    [gridSize, gridSize],
                    { lineWidth: 4 },
                )
            })
        })
    }

    static #drawPlayer(player) {
        player.image[player.direction][[0, 1, 1, 0, 2, 2][player.walkCount % 6]].draw(
            ctxMain,
            [gridSize * player.displayP.x, gridSize * (player.displayP.y - 1)],
            [gridSize, gridSize * 2],
        )
    }
}

drawHandler.initialize()

const playTimeHandler = new (class {
    #playTimeSum = 0 // 合計プレイ時間
    #playStartTime = 0 // 現在のセッション開始時間
    #blurStartTime = 0 // ブラー開始時間

    initialize(playTime) {
        this.#playTimeSum = playTime
        this.#playStartTime = Date.now()
    }

    formatPlayTime(ms) {
        // ミリ秒から各単位を計算
        const seconds = ("" + Math.floor(ms / 1000)).padStart(2, "0")
        const hours = ("" + Math.floor(seconds / 3600)).padStart(2, "0")
        const minutes = ("" + Math.floor((seconds % 3600) / 60)).padStart(2, "0")
        const remainingSeconds = ("" + (seconds % 60)).padStart(2, "0")

        return `${hours}:${minutes}:${remainingSeconds}`
    }

    getFormattedPlayTimeSum() {
        const ms = this.getPlayTimeSum()
        return this.formatPlayTime(ms)
    }

    getPlayTimeSum() {
        const incremental = Date.now() - this.#playStartTime

        if (!focusState.isFocused) {
            const blurDuration = Date.now() - this.#blurStartTime
            return incremental + this.#playTimeSum - blurDuration
        }

        return incremental + this.#playTimeSum
    }

    observeFocusState() {
        if (focusState.justBlurred) {
            this.#blurStartTime = Date.now()
        } else if (focusState.justFocused) {
            const blurDuration = Date.now() - this.#blurStartTime
            this.#playStartTime += blurDuration
        }
    }
})()

const getArrowKeyAction = (pattern) => {
    const v = vec(0, 0)

    if (keyboard[pattern].has("ArrowRight")) {
        v.x += 1
    } else if (keyboard[pattern].has("ArrowLeft")) {
        v.x -= 1
    } else if (keyboard[pattern].has("ArrowUp")) {
        v.y -= 1
    } else if (keyboard[pattern].has("ArrowDown")) {
        v.y += 1
    }

    return v
}

let mapData = {}

const tileImageCache = new Map()
const spriteImageCache = new Map()
