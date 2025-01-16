const displayMapWidth = 16
const gridSize = width / displayMapWidth

const sceneMain = new (class {
    #mode
    #mapId
    #goods

    constructor() {
        this.#mapId = "test"
        this.#mode = "move"
    }

    async setMapId(mapId, ms) {
        this.#mapId = mapId
        await changeScene(sceneMain, ms)
    }

    addGoods(goods) {
        this.#goods.push(goods)
    }

    goodsHas(goodsName) {
        return this.#goods.includes(goodsName)
    }

    loadSaveData(savedata) {
        this.#goods = savedata.goods ?? []
        this.#mapId = savedata.mapId ?? "train"
        playerManager.p = vec(savedata.position.x, savedata.position.y)
        playTimeManager.initialize(savedata.playTime)
    }

    async start() {
        this.#mode = "loading"

        await loadScript(`mapData/${this.#mapId}.mapdata`)
        await mapManager.start()

        drawHandler.lightColour = mapManager.mapData.lightColour

        await mapManager.mapData.start?.()

        this.#mode = "move"
    }

    loop() {
        playTimeManager.observeFocusState()

        // if (!focusState.isFocused) return

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
        }
    }

    #modeLoading() {
        Irect(ctxMain, "#111", [0, 0], [width, height])
        Itext(ctxMain, "azure", "dot", 48, [20, 20], "なうろーでぃんぐ...")
    }

    #modeMove() {
        if (keyboard.pushed.has("cancel")) {
            this.#mode = "menu"
            modeMenu.start({ goods: this.#goods })
        } else if (keyboard.pushed.has("KeyC")) {
            this.#gotoEdit()
        }

        playerManager.controlPlayer()
        this.#draw()

        // 移動が終わったら、スプライトの効果を
        const gap = playerManager.p.sub(playerManager.displayP)
        const isEndPlayerMove = gap.length() < 0.1
        if (!isEndPlayerMove) return
        this.#resolveSpriteAction()
    }

    #gotoEdit() {
        changeScene(sceneEdit, 100)
    }

    #draw() {
        drawHandler.loop()
    }

    #resolveSpriteAction() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        mapManager.sprites.forEach((sprite) => {
            const spriteGrid = []

            ILoop([1, 1], sprite.size, (x, y) => {
                spriteGrid.push(`${sprite.x + x - 1},${sprite.y + y - 1}`)
            })

            const isInArea = spriteGrid.includes(`${playerManager.p.x},${playerManager.p.y}`)

            const directionGrid = playerManager.p.add(
                {
                    right: vec(1, 0),
                    left: vec(-1, 0),
                    up: vec(0, -1),
                    down: vec(0, 1),
                }[playerManager.direction],
            )

            const isLooking = spriteGrid.includes(`${directionGrid.x},${directionGrid.y}`)

            switch (sprite.type) {
                case "move": {
                    if (isInArea && playerManager.direction == sprite.direction) {
                        playerManager.p.l = sprite.position
                        playerManager.displayP.l = sprite.position
                        playerManager.previousP.l = sprite.position

                        this.setMapId(sprite.mapId, 1000)
                    }
                    break
                }
                case "talk": {
                    if (!isLooking) break

                    playerManager.exclamation.draw(
                        ctxMain,
                        playerManager.p.add(vec(0, -2)).mlt(gridSize).l,
                        [gridSize, gridSize],
                        //
                    )

                    if (!keyboard.pushed.has("ok")) return

                    // playerの方を向く
                    const reverse = {
                        down: "up",
                        left: "right",
                        up: "down",
                        right: "left",
                    }[playerManager.direction]

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
            goods: this.#goods,
        })

        switch (response) {
            case "move": {
                this.#mode = "move"
                break
            }
            case "edit": {
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
})()

const playerManager = new (class {
    constructor() {
        this.p = vec(0, 0)
        this.displayP = vec(0, 0)
        this.previousP = vec(0, 0)
        this.direction = "down"
        this.moveInterval = 10
        this.moveIntervalCount = 0
        this.walkCount = 0
        this.image = {
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
        }

        this.exclamation = new Iimage("images/exclamation.png")

        this.isDash = false
    }

    controlPlayer() {
        const interval = this.isDash ? this.moveInterval / 2 : this.moveInterval

        this.displayP = this.previousP.add(this.p.sub(this.previousP).mlt(1 - this.moveIntervalCount / interval))

        this.#updateCameraState()

        if (this.moveIntervalCount > 0) {
            this.moveIntervalCount--
            return
        }

        const v = vec(0, 0)

        if (keyboard.pressed.has("ArrowRight")) {
            this.direction = "right"
            v.x += 1
        } else if (keyboard.pressed.has("ArrowLeft")) {
            this.direction = "left"
            v.x -= 1
        } else if (keyboard.pressed.has("ArrowUp")) {
            this.direction = "up"
            v.y -= 1
        } else if (keyboard.pressed.has("ArrowDown")) {
            this.direction = "down"
            v.y += 1
        }

        this.isDash = false

        if (v.length() > 0) {
            if (keyboard.pressed.has("ShiftLeft")) this.isDash = true

            // 目の前に壁となるスプライトがあるか?

            const unWalkableGrid = [...mapManager.unWalkableGrid]

            mapManager.sprites.forEach((sprite) => {
                if (sprite.walkable) return
                ILoop([1, 1], sprite.size, (x, y) => {
                    unWalkableGrid.push(`${sprite.x + x - 1},${sprite.y + y - 1}`)
                })
            })

            const nextPlayerP = this.p.add(v)

            const walkable = !unWalkableGrid.includes(`${nextPlayerP.x},${nextPlayerP.y}`)

            if (walkable) {
                const interval = this.isDash ? this.moveInterval / 2 : this.moveInterval

                this.previousP = this.p
                this.p = this.p.add(v)
                this.moveIntervalCount = interval

                this.walkCount++
            } else {
                this.walkCount = 0
            }
        } else {
            this.walkCount = 0
        }

        // 端
        if (this.p.x < 0) this.p.x = 0
        if (this.p.y < 0) this.p.y = 0
        if (this.p.x > mapManager.mapData.width - 1) this.p.x = mapManager.mapData.width - 1
        if (this.p.y > mapManager.mapData.height - 1) this.p.y = mapManager.mapData.height - 1
    }

    #updateCameraState() {
        Icamera.p = playerManager.displayP.add(vec(0.5, 0.5)).mlt(gridSize)

        if (Icamera.p.x < width / 2) Icamera.p.x = width / 2
        if (Icamera.p.y < height / 2) Icamera.p.y = height / 2
        if (Icamera.p.x > gridSize * mapManager.mapData.width - width / 2)
            Icamera.p.x = gridSize * mapManager.mapData.width - width / 2
        if (Icamera.p.y > gridSize * mapManager.mapData.height - height / 2)
            Icamera.p.y = gridSize * mapManager.mapData.height - height / 2

        if (displayMapWidth > mapManager.mapData.width) {
            Icamera.p.x = width / 2 - ((displayMapWidth - mapManager.mapData.width) * gridSize) / 2
        }

        if (displayMapWidth * (3 / 4) > mapManager.mapData.height) {
            Icamera.p.y = height / 2 - ((displayMapWidth * (3 / 4) - mapManager.mapData.height) * gridSize) / 2
        }
    }
})()

const drawHandler = new (class {
    #gradient
    lightColour = undefined

    constructor() {
        this.#gradient = ctxMain.createLinearGradient(0, 0, 0, height)
        this.#gradient.addColorStop(0, "#FFD700") // 黄色
        this.#gradient.addColorStop(0.3, "#FF8C00") // オレンジ
        this.#gradient.addColorStop(0.6, "#FF4500") // 赤
        this.#gradient.addColorStop(0.9, "#8A2BE2") // 紫
        this.#gradient.addColorStop(1, "#000080") // 暗い青
    }

    loop() {
        Irect(ctxMain, "#111", [0, 0], [width, height])

        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#drawMap()
        this.#drawSprites()
        this.#drawPlayer()

        ctxMain.restore()

        this.#addLightEffect()
    }

    #addLightEffect() {
        if (!this.lightColour) return

        ctxMain.save()
        ctxMain.globalCompositeOperation = "multiply"
        Irect(ctxMain, this.lightColour, [0, 0], [width, height])
        // Irect(ctxMain, this.#gradient, [0, 0], [width, height])
        ctxMain.restore()
    }

    #drawMap() {
        // background
        ctxMain.drawImage(mapManager.background, 0, 0)
    }

    #drawSprites() {
        // sprites
        mapManager.sprites.forEach((sprite) => {
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

    #drawPlayer() {
        playerManager.image[playerManager.direction][[0, 1, 1, 0, 2, 2][playerManager.walkCount % 6]].draw(
            ctxMain,
            playerManager.displayP.add(vec(0, -1)).mlt(gridSize).l,
            [gridSize, gridSize * 2],
        )
    }
})()

const playTimeManager = new (class {
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

const mapManager = new (class {
    map
    mapData
    unWalkableGrid
    background
    sprites
    grid

    async start() {
        this.mapData = mapData

        this.background = document.createElement("canvas")

        await this.#forDebugFetchTileImage()

        this.reset()

        const spriteLoaded = Promise.all(this.sprites.filter((s) => s.image).map((s) => s.image.loaded))

        this.unWalkableGrid = new Set()

        await this.drawBackground()
        await spriteLoaded
    }

    reset() {
        ;[this.grid, this.sprites] = this.#generateMap(this.mapData)
    }

    #generateMap(mapData) {
        const dataLength = mapData.width * mapData.height
        const trimmedGrid = mapData.grid.replaceAll(/ |\n/g, "")
        const filledGrid = (trimmedGrid + "00".repeat(dataLength)).slice(0, dataLength * 2)

        const grid = filledGrid
        const sprites = mapData.sprites.map((spriteData) => this.#generateSprite(...spriteData))

        return [grid, sprites]
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

    async drawBackground() {
        const [column, row] = [this.mapData.width, this.mapData.height]

        this.background.width = gridSize * column
        this.background.height = gridSize * row

        const ctx = this.background.getContext("2d")

        ctx.imageSmoothingEnabled = false

        await ILoopAsync([0, 0], [column - 1, row - 1], async (x, y) => {
            const tileId = this.grid.slice(2 * (x + column * y), 2 * (x + column * y) + 2)

            // 知られざるtileId
            if (!(tileId in mapTile)) return

            let [path, option] = mapTile[tileId].split("/")
            if (path[0] == "!") {
                path = path.substring(1)
                this.unWalkableGrid.add(`${x},${y}`)
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
