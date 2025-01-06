const sceneMain = new (class {
    #frame
    #mode
    #player
    #gridSize
    #background
    #map
    #unWalkableGrid
    #width
    #mapData
    #mapId

    constructor() {
        this.#mapId = "test"
        // this.#map = mapData[this.mapId]

        this.#unWalkableGrid = new Set()

        this.#width = 18

        // たぶん72
        this.#gridSize = width / this.#width

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

    async start() {
        this.#mode = "loading"

        await loadScript(`mapData/${this.#mapId}.js`)

        this.#mapData = mapData

        this.#map = this.#generateMap(mapData)

        const spriteImageLoadPromise = Promise.all(this.#map.sprites.filter((s) => s.image).map((s) => s.image.loaded))

        this.#unWalkableGrid.clear()

        const drawBackgroundPromise = this.#drawBackground()

        await Promise.all([spriteImageLoadPromise, drawBackgroundPromise])

        this.#mode = "move"
    }

    #generateMap(mapData) {
        const map = {
            width: mapData.width,
            height: mapData.height,
            grid: mapData.grid.replaceAll(/ |\n/g, ""),
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
            ...args,
        }

        if (args.image) {
            const imageId = args.image.join()

            if (!spriteImageCache.has(imageId)) {
                spriteImageCache.set(imageId, new Iimage(...args.image))
            }

            sprite.image = spriteImageCache.get(imageId)
        }

        return sprite
    }

    async #drawBackground() {
        this.#background = document.createElement("canvas")
        const [column, row] = [this.#map.width, this.#map.height]

        this.#background.width = this.#gridSize * column
        this.#background.height = this.#gridSize * row
        const ctx = this.#background.getContext("2d")

        const grid = this.#map.grid.replaceAll(/ |\n/g, "")

        await AsyncILoop([0, 0], [column - 1, row - 1], async (x, y) => {
            const tileId = grid.slice(2 * (x + column * y), 2 * (x + column * y) + 2)

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

            tileImage.draw(ctx, this.#gridSize * x, this.#gridSize * y, this.#gridSize, this.#gridSize)
            // Irect(ctx, "azure", this.#gridSize * x, this.#gridSize * y, this.#gridSize, this.#gridSize, {
            //     line_width: 2,
            // })
        })
    }

    loop() {
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
        Irect(ctxMain, "#111", 0, 0, width, height)
        Itext(ctxMain, "azure", "dot", 48, width, height / 2, "なうろーでぃんぐ...", { textAlign: "right" })
    }

    #modeMove() {
        if (keyboard.pushed.has("cancel")) this.#mode = "menu"
        else if (keyboard.pushed.has("KeyC")) {
            this.#mode = "edit"
            this.#gotoEdit()
        }

        this.#controlPlayer()
        this.#draw()

        const gap = this.#player.p.sub(this.#player.displayP)

        const isEndPlayerMove = gap.length() < 0.1

        if (!isEndPlayerMove) return

        this.#resolveSpriteAction()
    }

    #gotoEdit() {
        editHandler.start({
            gridSize: this.#gridSize,
            mapData: this.#mapData,
            playerP: this.#player.p,
            background: this.#background,
            unWalkableGrid: this.#unWalkableGrid,
        })
    }

    #draw() {
        Irect(ctxMain, "#111", 0, 0, width, height)

        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#drawMap()
        this.#drawSprites()
        this.#drawPlayer()

        ctxMain.restore()

        ctxMain.save()
        ctxMain.globalCompositeOperation = "overlay"
        // Irect(ctxMain, "#804012c0", 0, 0, width, height)
        ctxMain.restore()
    }

    #updateCameraState() {
        // Icamera.run(this.#player.displayP.mlt(this.#gridSize))
        Icamera.p = this.#player.displayP.add(vec(0.5, 0.5)).mlt(this.#gridSize)

        if (Icamera.p.x < width / 2) Icamera.p.x = width / 2
        if (Icamera.p.y < height / 2) Icamera.p.y = height / 2
        if (Icamera.p.x > this.#gridSize * this.#map.width - width / 2)
            Icamera.p.x = this.#gridSize * this.#map.width - width / 2
        if (Icamera.p.y > this.#gridSize * this.#map.height - height / 2)
            Icamera.p.y = this.#gridSize * this.#map.height - height / 2

        if (this.#width > this.#map.width) {
            Icamera.p.x = width / 3
        }
    }

    #drawMap() {
        // background
        ctxMain.drawImage(this.#background, 0, 0)
    }

    #drawSprites() {
        // sprites
        this.#map.sprites.forEach((sprite) => {
            if (sprite.image) {
                sprite.image.draw(
                    ctxMain,
                    this.#gridSize * sprite.x,
                    this.#gridSize * sprite.y,
                    this.#gridSize * sprite.size[0],
                    this.#gridSize * sprite.size[1],
                )
            } else {
                ILoop([1, 1], sprite.size, (x, y) => {
                    Irect(
                        ctxMain,
                        "#08f8",
                        this.#gridSize * (sprite.x + x - 1),
                        this.#gridSize * (sprite.y + y - 1),
                        this.#gridSize,
                        this.#gridSize,
                        { line_width: 4 },
                    )
                })
            }
        })
    }

    #drawPlayer() {
        this.#player.image[this.#player.direction][[0, 1, 0, 2][this.#player.walkCount % 4]].draw(
            ctxMain,
            this.#gridSize * this.#player.displayP.x,
            this.#gridSize * (this.#player.displayP.y - 1),
            this.#gridSize,
            this.#gridSize * 2,
        )
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
            // 周囲8マスのみ確認
            // if (vec(sprite.x, sprite.y).sub(this.#player.p).length() > 1.5) return

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
                        Icamera.p = this.#player.p.add(vec(0.5, 0.5)).mlt(this.#gridSize)
                    }
                    break
                }
                case "talk": {
                    if (isLooking) {
                        this.#player.exclamation.draw(
                            ctxMain,
                            this.#gridSize * this.#player.p.x,
                            this.#gridSize * (this.#player.p.y - 2),
                            this.#gridSize,
                            this.#gridSize,
                        )

                        if (!keyboard.pushed.has("ok")) return

                        this.#mode = "event"
                        eventHandler.generator = sprite.event()
                        eventHandler.start()
                    }
                    break
                }
            }
        })

        ctxMain.restore()
    }

    #modeMenu() {
        this.#draw()

        const response = menuHandler.loop()

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

        const isEnd = eventHandler.loop()

        if (isEnd) {
            this.#mode = "move"
        }
    }

    #modeEdit() {
        this.#draw()

        const response = editHandler.loop()

        switch (response) {
            case "editEnd": {
                this.#mode = "move"
                this.#map.sprites = this.#mapData.sprites.map((s) => this.#generateSprite(...s))
                break
            }
        }
    }
})()

const eventHandler = new (class {
    #isWaitingForInput
    #currentText
    #command
    #frame

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "dot",
            48,
            "azure",
            40,
            780,
            new IDict({
                "": [],
            }),
            { se: false },
        )
    }

    start() {
        this.#next()
        this.#isWaitingForInput = true
    }

    async #next(response) {
        this.#isWaitingForInput = false

        const { value, done } = await this.generator.next(response)

        this.#currentText = value

        if (!done && typeof this.#currentText != "string" && this.#currentText[0] == "question") {
            this.#command.reset()
            this.#command.options.dict[""] = this.#currentText[1]
            this.#command.titles.dict[""] = this.#currentText[2] ?? ""
        }

        if (!done) {
            this.#frame = 0
        }
    }

    loop() {
        if (this.#currentText == null) {
            return true
        }

        if (typeof this.#currentText == "string") {
            this.#solveText()
        } else {
            this.#solveCommand()
        }
    }

    #solveText() {
        if (this.#currentText == "") {
            if (this.#isWaitingForInput) {
                this.#next().then(() => {
                    this.#isWaitingForInput = true
                })
            }

            return
        }

        Irect(ctxMain, "#111111f0", 20, 760, width - 40, 295)
        Irect(ctxMain, "azure", 20, 760, width - 40, 295, {
            line_width: 2,
        })

        const blink = this.#frame % 60 < 30 && this.#isWaitingForInput ? "#{colour}{azure}▼" : ""

        const isEnd = Itext(ctxMain, "azure", "dot", 48, 40, 780, this.#currentText + blink, {
            frame: this.#frame++ / 3,
            se: voice,
        })

        if (this.#isWaitingForInput) {
            if (keyboard.pushed.has("ok") || keyboard.pushed.has("cancel") || mouse.clicked) {
                if (!isEnd) {
                    this.#frame = 100000
                    return
                }

                this.#next().then(() => {
                    this.#isWaitingForInput = true
                })
            }
        }
    }

    #solveCommand() {
        switch (this.#currentText[0]) {
            case "question":
                Irect(ctxMain, "#111111f0", 20, 760, width - 40, 295)
                Irect(ctxMain, "azure", 20, 760, width - 40, 295, {
                    line_width: 2,
                })

                this.#command.run()

                if (this.#isWaitingForInput) {
                    if (this.#command.is_match(".")) {
                        this.#next(this.#command.branch).then(() => {
                            this.#isWaitingForInput = true
                        })
                    }
                }
                break
        }
    }
})()

const menuHandler = new (class {
    #menuCommand

    constructor() {
        this.#menuCommand = new Icommand(
            ctxMain,
            "dot",
            48,
            "azure",
            20,
            220,
            new IDict({
                "": ["持ち物", "装備", "セーブ", "#{colour}{red}終了", "#{colour}{lightGreen}☆編集☆"],
                "1": ["/Taro", "/Shun"],
                "1.": ["_頭", "_体", "_脚", "_靴"],
                "2": ["/0", "/1", "/2"],
                "3": ["はい", "!いいえ"],
            }),
            { titles: new IDict({ "3": "ほんとに?" }) },
        )
    }

    loop() {
        Irect(ctxMain, "#111111c0", 0, 0, width, height)

        if (keyboard.pushed.has("cancel") && this.#menuCommand.branch == "") return "move"

        this.#menuCommand.run()

        Itext(ctxMain, "azure", "dot", 48, 60, 100, "現在地: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 100, "プレイ時間: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 150, "目的: ")

        if (!this.#menuCommand.is_match("2|1.")) {
            for (let i = 0; i < 2; i++) {
                Irect(ctxMain, "#111c", 400, 270 + i * 300, 1000, 250)
                Irect(ctxMain, "azure", 400, 270 + i * 300, 1000, 250, { line_width: 2 })
            }
        }

        if (this.#menuCommand.is_match("1")) {
            const num = this.#menuCommand.num
            Irect(ctxMain, "azure", 400, 270 + num * 300, 1000, 250, { line_width: 8 })
        } else if (this.#menuCommand.is_match("1.")) {
            const num = this.#menuCommand.num
            const text = ["なし", "セーター", "ジーンズ", "ボロボロの靴"][num]
            Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 270, text)
        } else if (this.#menuCommand.is_match("2")) {
            Irect(ctxMain, "#111c", 40, 270, 1360, 250)
            Irect(ctxMain, "azure", 40, 270, 1360, 250, { line_width: 2 })
        } else if (this.#menuCommand.is_match("30")) {
            this.#menuCommand.reset()
            changeScene(sceneTitle, 1000)
        } else if (this.#menuCommand.is_match("31")) {
            this.#menuCommand.cancel(2)
        } else if (this.#menuCommand.is_match("4")) {
            this.#menuCommand.reset()
            return "edit"
        }
    }
})()

const editHandler = new (class {
    #gridSize
    #grid
    #cursor
    #mapData
    #mode
    #command
    #tileId
    #sprite
    #ctx
    #unWalkableGrid

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "dot",
            80,
            "azure",
            1120,
            60,
            new IDict({
                "": [],
            }),
            { max_line_num: 12, titles: new IDict({ "": "tileId" }), se: false },
        )
    }

    start({ gridSize, mapData, playerP, background, unWalkableGrid }) {
        this.#command.options.dict[""] = Object.keys(mapTile)

        this.#ctx = background.getContext("2d")
        this.#mapData = mapData
        this.#gridSize = gridSize
        this.#grid = []
        this.#cursor = playerP
        this.#unWalkableGrid = unWalkableGrid

        const tiles = mapData.grid.replaceAll(/ |\n/g, "").match(/.{2}/g)

        for (let i = 0; i < mapData.height; i++) {
            this.#grid.push(tiles.slice(mapData.width * i, mapData.width * (i + 1)))
        }

        this.#tileId = "00"
        this.#sprite = null

        this.#mode = "paint"
    }

    loop() {
        switch (this.#mode) {
            case "paint": {
                this.#modePaint()
                break
            }
            case "select": {
                this.#modeSelect()
                break
            }
        }

        if (keyboard.pushed.has("Escape")) {
            return "editEnd"
        }
    }

    #modePaint() {
        this.#controlCursor()
        this.#displaySelectGridTile()
        this.#displaySelectGridSprite()
        this.#displayCurrentBrush()

        Icamera.p = this.#cursor.add(vec(0.5, 0.5)).mlt(this.#gridSize)

        this.#draw()

        if (keyboard.pushed.has("KeyX")) {
            this.#mode = "select"
        } else if (keyboard.longPressed.has("KeyZ")) {
            this.#paint()
        } else if (keyboard.ctrlKey && keyboard.pushed.has("KeyS")) {
            electron.writeMapData(this.#mapData.id, `mapData = ${objectToJsString(this.#mapData)}`)
            new Ianimation(2000).start((x) => {
                Itext(
                    ctxMain,
                    `hsl(0,100%,100%,${(1 - x) * 100}%)`,
                    "dot",
                    96,
                    width,
                    60,
                    `${this.#mapData.id} is saved!`,
                    { textAlign: "right" },
                )
            })
        } else if (keyboard.pushed.has("KeyC")) {
            this.#pickupSprite()
        }
    }

    #paint() {
        const grid = this.#mapData.grid.replaceAll(/ |\n/g, "")

        const p = this.#cursor.x + this.#mapData.width * this.#cursor.y
        this.#mapData.grid = grid.slice(0, 2 * p) + this.#tileId + grid.slice(2 * p + 2)

        const image = tileImageCache.get(this.#tileId)
        image.draw(
            this.#ctx,
            this.#gridSize * this.#cursor.x,
            this.#gridSize * this.#cursor.y,
            this.#gridSize,
            this.#gridSize,
        )

        // update walkable grid
        const q = `${this.#cursor.x},${this.#cursor.y}`
        this.#unWalkableGrid.add(q)
        if (mapTile[this.#tileId][0] != "!") this.#unWalkableGrid.delete(q)
    }

    #pickupSprite() {
        if (this.#sprite) {
            let canPut = true

            this.#whenCursorTouchSprite((s) => {
                canPut = false
            })

            if (canPut) {
                this.#sprite[1] = [this.#cursor.x, this.#cursor.y]
                this.#sprite = null
            }

            return
        }

        this.#whenCursorTouchSprite((s) => {
            this.#sprite = s
        })
    }

    #whenCursorTouchSprite(callback) {
        this.#mapData.sprites.forEach((s) => {
            ILoop([1, 1], s[2]?.size ?? [1, 1], (x, y) => {
                if (this.#cursor.x == s[1][0] + x - 1 && this.#cursor.y == s[1][1] + y - 1) {
                    this.#sprite = s
                    callback(s)
                }
            })
        })
    }

    #modeSelect() {
        Irect(ctxMain, "#11111180", 1100, 40, 300, 1010)
        Irect(ctxMain, "azure", 1100, 40, 300, 1010, { line_width: 2 })
        this.#command.run()

        let index = 0
        for (const tileId in mapTile) {
            if (tileImageCache.has(tileId)) {
                tileImageCache.get(tileId).draw(ctxMain, 1300, 150 + index * 80, 60, 60)
            }
            index++
        }

        if (this.#command.is_match(".")) {
            this.#tileId = this.#command.get_selected_option()
            this.#command.cancel()
            this.#mode = "paint"
        }

        if (keyboard.pushed.has("KeyX")) {
            this.#mode = "paint"
        }
    }

    #controlCursor() {
        const v = vec(0, 0)

        if (keyboard.longPressed.has("ArrowRight")) {
            v.x += 1
        } else if (keyboard.longPressed.has("ArrowLeft")) {
            v.x -= 1
        } else if (keyboard.longPressed.has("ArrowUp")) {
            v.y -= 1
        } else if (keyboard.longPressed.has("ArrowDown")) {
            v.y += 1
        }

        this.#cursor = this.#cursor.add(v)

        // 端
        if (this.#cursor.x < 0) this.#cursor.x = 0
        if (this.#cursor.y < 0) this.#cursor.y = 0
        if (this.#cursor.x > this.#mapData.width - 1) this.#cursor.x = this.#mapData.width - 1
        if (this.#cursor.y > this.#mapData.height - 1) this.#cursor.y = this.#mapData.height - 1
    }

    #displaySelectGridTile() {
        Irect(ctxMain, "#11111180", 40, 40, 300, 300)
        Irect(ctxMain, "azure", 40, 40, 300, 300, { line_width: 2 })

        const tileId = this.#grid[this.#cursor.y][this.#cursor.x]

        const tileImage = tileImageCache.get(tileId)
        tileImage.draw(ctxMain, 60, 60, this.#gridSize, this.#gridSize)

        Itext(ctxMain, "azure", "dot", 32, 160, 60, `tileId: ${tileId}`)
    }

    #displaySelectGridSprite() {
        Irect(ctxMain, "#11111180", 40, 400, 300, 300)
        Irect(ctxMain, "azure", 40, 400, 300, 300, { line_width: 2 })

        this.#whenCursorTouchSprite((s) => {
            const size = s[2]?.size ?? [1, 1]

            Itext(ctxMain, "azure", "dot", 32, 65, 420, `spriteType: ${s[0]}`)
            Itext(ctxMain, "azure", "dot", 32, 65, 460, `size: [${size}]`)

            if (s[2] && s[2].image) {
                spriteImageCache
                    .get(s[2].image.join())
                    .draw(ctxMain, 60, 500, this.#gridSize * size[0], this.#gridSize * size[1])
            }
        })
    }

    #displayCurrentBrush() {
        Irect(ctxMain, "#11111180", 40, 760, 300, 300)
        Irect(ctxMain, "azure", 40, 760, 300, 300, { line_width: 2 })

        const tileImage = tileImageCache.get(this.#tileId)
        tileImage.draw(ctxMain, 60, 780, this.#gridSize, this.#gridSize)

        Itext(ctxMain, "azure", "dot", 32, 160, 780, `tileId: ${this.#tileId}`)
    }

    #draw() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#drawCursor()

        ctxMain.restore()
    }

    #drawCursor() {
        Irect(
            ctxMain,
            "azure",
            this.#gridSize * this.#cursor.x,
            this.#gridSize * this.#cursor.y,
            this.#gridSize,
            this.#gridSize,
            { line_width: 2 },
        )
    }
})()

let mapData = {}

const tileImageCache = new Map()
const spriteImageCache = new Map()
