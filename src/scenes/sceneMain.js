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
        this.#mapId = "map-test"

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
        const dataLength = mapData.width * mapData.height
        const trimmedGrid = mapData.grid.replaceAll(/ |\n/g, "")
        const filledGrid = (trimmedGrid + "00".repeat(dataLength)).slice(0, dataLength * 2)

        this.#mapData.grid = filledGrid

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

    async #drawBackground() {
        for (const tileId in mapTile) {
            let [path, option] = mapTile[tileId].split("/")
            if (path[0] == "!") {
                path = path.substring(1)
            }
            const image = new Iimage(`images/mapTiles/${path}.png`, ...(option ?? "0,0").split(","), 16, 16)
            await image.loaded

            tileImageCache.set(tileId, image)
        }

        this.#background = document.createElement("canvas")
        const [column, row] = [this.#map.width, this.#map.height]

        this.#background.width = gridSize * column
        this.#background.height = gridSize * row
        const ctx = this.#background.getContext("2d")

        ctx.imageSmoothingEnabled = false

        const grid = this.#map.grid.replaceAll(/ |\n/g, "")

        await AsyncILoop([0, 0], [column - 1, row - 1], async (x, y) => {
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

            tileImage.draw(ctx, gridSize * x, gridSize * y, gridSize, gridSize)
            // Irect(ctx, "azure", gridSize * x, gridSize * y, gridSize, gridSize, {
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
        if (keyboard.pushed.has("cancel")) {
            this.#mode = "menu"
            modeMenu.start()
        } else if (keyboard.pushed.has("KeyC")) {
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
        modeEdit.start({
            gridSize: gridSize,
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
        // Icamera.run(this.#player.displayP.mlt(gridSize))
        Icamera.p = this.#player.displayP.add(vec(0.5, 0.5)).mlt(gridSize)

        if (Icamera.p.x < width / 2) Icamera.p.x = width / 2
        if (Icamera.p.y < height / 2) Icamera.p.y = height / 2
        if (Icamera.p.x > gridSize * this.#map.width - width / 2) Icamera.p.x = gridSize * this.#map.width - width / 2
        if (Icamera.p.y > gridSize * this.#map.height - height / 2)
            Icamera.p.y = gridSize * this.#map.height - height / 2

        if (displayMapWidth > this.#map.width) {
            Icamera.p.x = width / 2 - ((displayMapWidth - this.#mapData.width) * gridSize) / 2
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
                sprite.image[sprite.direction].draw(
                    ctxMain,
                    gridSize * sprite.x,
                    gridSize * sprite.y,
                    gridSize * sprite.size[0],
                    gridSize * sprite.size[1],
                )
            } else {
                ILoop([1, 1], sprite.size, (x, y) => {
                    Irect(
                        ctxMain,
                        "#08f8",
                        gridSize * (sprite.x + x - 1),
                        gridSize * (sprite.y + y - 1),
                        gridSize,
                        gridSize,
                        { line_width: 4 },
                    )
                })
            }
        })
    }

    #drawPlayer() {
        this.#player.image[this.#player.direction][[0, 1, 0, 2][this.#player.walkCount % 4]].draw(
            ctxMain,
            gridSize * this.#player.displayP.x,
            gridSize * (this.#player.displayP.y - 1),
            gridSize,
            gridSize * 2,
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
                        Icamera.p = this.#player.p.add(vec(0.5, 0.5)).mlt(gridSize)
                    }
                    break
                }
                case "talk": {
                    if (!isLooking) break

                    this.#player.exclamation.draw(
                        ctxMain,
                        gridSize * this.#player.p.x,
                        gridSize * (this.#player.p.y - 2),
                        gridSize,
                        gridSize,
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

const modeEvent = new (class {
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

        this.#currentText = ""

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

const modeMenu = new (class {
    #menuCommand
    #frame

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

    start() {
        this.#frame = 0
        this.#menuCommand.reset()
    }

    loop({ mapName }) {
        Irect(ctxMain, "#111111c0", 0, 0, width, height)

        ctxMain.save()
        const progress = 1 - (1 - Math.min(1, this.#frame / 10)) ** 2

        ctxMain.globalAlpha = progress
        ctxMain.translate(0, (1 - progress) * 20)
        this.#frame++

        if (keyboard.pushed.has("cancel") && this.#menuCommand.branch == "") return "move"

        this.#menuCommand.run()

        Itext(ctxMain, "azure", "dot", 48, 60, 100, `現在地: ${mapName}`)
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

        ctxMain.restore()
    }
})()

const modeEdit = new (class {
    #grid
    #cursor
    #mapData
    #phase
    #command
    #brushTileId
    #pickedSprite
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
            { max_line_num: 11, titles: new IDict({ "": "tileId" }), se: false },
        )
    }

    start({ gridSize, mapData, playerP, background, unWalkableGrid }) {
        this.#command.options.dict[""] = Object.keys(mapTile)

        this.#ctx = background.getContext("2d")
        this.#ctx.imageSmoothingEnabled = false
        this.#mapData = mapData
        this.#grid = []
        this.#cursor = playerP
        this.#unWalkableGrid = unWalkableGrid

        this.#normalizeGrid()

        this.#brushTileId = "00"
        this.#pickedSprite = null

        this.#phase = "paint"
    }

    #normalizeGrid() {
        const tiles = mapData.grid.replaceAll(/ |\n/g, "").match(/.{2}/g)

        for (let i = 0; i < mapData.height; i++) {
            const row = tiles.slice(mapData.width * i, mapData.width * (i + 1))
            this.#grid.push(row)
        }
    }

    loop() {
        switch (this.#phase) {
            case "paint": {
                this.#phasePaint()
                break
            }
            case "rectangle": {
                this.#phaseRectangle()
                break
            }
            case "select": {
                this.#phaseSelect()
                break
            }
        }

        if (keyboard.pushed.has("Escape")) {
            return "editEnd"
        }
    }

    #phasePaint() {
        this.#controlCursor()
        this.#displaySelectGridTile()
        this.#displaySelectGridSprite()
        this.#displayCurrentBrush()
        this.#handleRange()

        // カーソルを画面の真ん中に
        Icamera.p = this.#cursor.add(vec(0.5, 0.5)).mlt(gridSize)

        this.#draw()

        //
        if (keyboard.pushed.has("KeyX")) {
            this.#phase = "select"
        } else if (keyboard.longPressed.has("KeyZ")) {
            this.#paint(this.#cursor.x, this.#cursor.y)
        } else if (keyboard.pushed.has("KeyB")) {
            this.#splashBucket(this.#grid[this.#cursor.y][this.#cursor.x], this.#cursor.x, this.#cursor.y)
        } else if (keyboard.pushed.has("KeyC")) {
            this.#pickupSprite()
        } else if (keyboard.pushed.has("ShiftLeft")) {
            this.#phase = "rectangle"
            phaseRectangle.start({
                startingPoint: this.#cursor,
                mapData: this.#mapData,
                grid: this.#grid,
            })
        } else if (keyboard.ctrlKey && keyboard.pushed.has("KeyS")) {
            this.#saveMapData()
        }
    }

    #handleRange() {
        Irect(ctxMain, "#11111180", 930, 40, 480, 190)
        Irect(ctxMain, "azure", 930, 40, 480, 190, { line_width: 2 })

        Itext(ctxMain, "azure", "dot", 60, 1200, 60, `width: `, { textAlign: "right" })
        Itext(ctxMain, "azure", "dot", 60, 1200, 140, `height: `, { textAlign: "right" })

        const rw = Irange(ctxMain, "azure", "dot", 60, 1200, 60, this.#mapData.width)
        const rh = Irange(ctxMain, "azure", "dot", 60, 1200, 140, this.#mapData.height)

        if (rw == 1) {
            this.#mapData.width++

            this.#grid.forEach((row) => {
                row.push("00")
            })

            this.#mapData.grid = this.#grid.flat(2).join("")
        } else if (rw == -1) {
            this.#mapData.width--

            this.#grid.forEach((row) => {
                row.pop()
            })

            this.#mapData.grid = this.#grid.flat(2).join("")
        } else if (rh == 1) {
            this.#mapData.height++

            this.#grid.push(Array(this.#mapData.width).fill("00"))

            this.#mapData.grid = this.#grid.flat(2).join("")
        } else if (rh == -1) {
            this.#mapData.height--

            this.#grid.pop()

            this.#mapData.grid = this.#grid.flat(2).join("")
        }
    }

    #saveMapData() {
        this.#mapData.grid = this.#grid.flat(2).join("")
        electron.writeMapData(this.#mapData.id, `mapData = ${objectToJsString(this.#mapData)}`)
        new Ianimation(2000).start((x) => {
            Itext(
                ctxMain,
                `hsl(0,100%,100%,${(1 - x) * 100}%)`,
                "dot",
                96,
                width,
                height - 96,
                `${this.#mapData.id} is saved!`,
                { textAlign: "right" },
            )
        })
    }

    #paint(x, y) {
        this.#grid[y][x] = this.#brushTileId
        this.#mapData.grid = this.#grid.flat(2).join("")

        const image = tileImageCache.get(this.#brushTileId)
        image.draw(this.#ctx, gridSize * x, gridSize * y, gridSize, gridSize)

        // update walkable grid
        const positionString = `${x},${y}`
        this.#unWalkableGrid.add(positionString)
        if (mapTile[this.#brushTileId][0] != "!") this.#unWalkableGrid.delete(positionString)
    }

    #splashBucket(targetTile, x, y) {
        this.#paint(x, y)

        const surround = [
            [0, 1],
            [0, -1],
            [1, 0],
            [-1, 0],
        ]

        surround.forEach(([z, w]) => {
            if (this.#grid[y + w][x + z] == targetTile) this.#splashBucket(targetTile, x + z, y + w)
        })
    }

    #pickupSprite() {
        // put
        if (this.#pickedSprite) {
            let canPut = true

            if (canPut) {
                this.#pickedSprite[1] = [this.#cursor.x, this.#cursor.y]
                this.#pickedSprite = null
            }

            return
        }

        // pickup
        this.#whenCursorTouchSprite((s) => {
            this.#pickedSprite = s
        })
    }

    #phaseRectangle() {
        const response = phaseRectangle.loop()

        if (response == "end") {
            console.log(this.#grid)
            this.#saveMapData()
            this.#phase = "paint"
        }
    }

    #whenCursorTouchSprite(callback) {
        this.#mapData.sprites.forEach((s) => {
            ILoop([1, 1], s[2]?.size ?? [1, 1], (x, y) => {
                if (this.#cursor.x == s[1][0] + x - 1 && this.#cursor.y == s[1][1] + y - 1) {
                    this.#pickedSprite = s
                    callback(s)
                }
            })
        })
    }

    #phaseSelect() {
        Irect(ctxMain, "#11111180", 1100, 40, 300, 1010)
        Irect(ctxMain, "azure", 1100, 40, 300, 1010, { line_width: 2 })
        this.#command.run()

        let index = 0
        for (const tileId in mapTile) {
            const num = index - this.#command.position
            if (0 <= num && num < 11 && tileImageCache.has(tileId)) {
                tileImageCache.get(tileId).draw(ctxMain, 1300, 150 + num * 80, 60, 60)
            }
            index++
        }

        if (this.#command.is_match(".")) {
            this.#brushTileId = this.#command.get_selected_option()
            this.#command.cancel()
            this.#phase = "paint"
        }

        if (keyboard.pushed.has("KeyX")) {
            this.#phase = "paint"
        }
    }

    #controlCursor() {
        const v = getArrowKeyAction("longPressed")

        this.#cursor = this.#cursor.add(v)

        // カーソルが画面外に行かないように
        if (this.#cursor.x < 0) this.#cursor.x = 0
        if (this.#cursor.y < 0) this.#cursor.y = 0
        if (this.#cursor.x > this.#mapData.width - 1) this.#cursor.x = this.#mapData.width - 1
        if (this.#cursor.y > this.#mapData.height - 1) this.#cursor.y = this.#mapData.height - 1
    }

    #displaySelectGridTile() {
        Irect(ctxMain, "#11111180", 40, 40, 300, 300)
        Irect(ctxMain, "azure", 40, 40, 300, 300, { line_width: 2 })

        const tileId = this.#grid[this.#cursor.y][this.#cursor.x]

        if (!tileId) return

        const tileImage = tileImageCache.get(tileId)
        tileImage.draw(ctxMain, 60, 60, gridSize, gridSize)

        Itext(ctxMain, "azure", "dot", 32, 160, 60, `tileId: ${tileId}`)
        Itext(ctxMain, "azure", "dot", 32, 160, 100, `x: ${this.#cursor.x},y: ${this.#cursor.y}`)
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
                    .get(s[2].image[s[2].direction ?? "down"].join())
                    .draw(ctxMain, 60, 500, gridSize * size[0], gridSize * size[1])
            }
        })
    }

    #displayCurrentBrush() {
        Irect(ctxMain, "#11111180", 40, 760, 300, 300)
        Irect(ctxMain, "azure", 40, 760, 300, 300, { line_width: 2 })

        const tileImage = tileImageCache.get(this.#brushTileId)
        tileImage.draw(ctxMain, 60, 780, gridSize, gridSize)

        Itext(ctxMain, "azure", "dot", 32, 160, 780, `tileId: ${this.#brushTileId}`)
    }

    #draw() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#drawCursor()

        ctxMain.restore()
    }

    #drawCursor() {
        Irect(ctxMain, "azure", gridSize * this.#cursor.x, gridSize * this.#cursor.y, gridSize, gridSize, {
            line_width: 2,
        })
    }
})()

const phaseRectangle = new (class {
    #startingPoint = vec(0, 0)
    #displacement = vec(0, 0)
    #mapData
    #grid = [[]]
    #step = "decide"
    #selectGrid

    constructor() {}

    start({ startingPoint, mapData, grid }) {
        this.#startingPoint = startingPoint
        this.#displacement = vec(1, 1)
        this.#mapData = mapData
        this.#grid = grid
        this.#step = "decide"
    }

    loop() {
        switch (this.#step) {
            case "decide": {
                this.#controlDisplacement()
                this.#decideEndingPoint()
                this.#displaySelectGrid()
                break
            }
            case "move": {
                this.#controlDisplacement()
                this.#putRectangle()
                this.#displayMovingGrid()
                break
            }
            case "end": {
                return "end"
            }
        }
    }

    #displaySelectGrid() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        Irect(
            ctxMain,
            "azure",
            gridSize * this.#startingPoint.x,
            gridSize * this.#startingPoint.y,
            gridSize * this.#displacement.x,
            gridSize * this.#displacement.y,
            { line_width: 4, lineDash: [4, 4] },
        )

        ctxMain.restore()
    }

    #displayMovingGrid() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        Irect(
            ctxMain,
            "azure",
            gridSize * (this.#startingPoint.x + this.#displacement.x),
            gridSize * (this.#startingPoint.y + this.#displacement.y),
            gridSize,
            gridSize,
            { line_width: 4, lineDash: [4, 4] },
        )

        ctxMain.restore()
    }

    #controlDisplacement() {
        const v = getArrowKeyAction("longPressed")

        this.#displacement = this.#displacement.add(v)

        const endingPoint = this.#startingPoint.add(this.#displacement)

        // カーソルが画面外に行かないように
        if (endingPoint.x < 0) this.#displacement.x = -this.#startingPoint.x
        if (endingPoint.y < 0) this.#displacement.y = -this.#startingPoint.y
        if (endingPoint.x > this.#mapData.width - 1) this.#displacement.x = endingPoint.x + this.#mapData.width - 1
        if (endingPoint.y > this.#mapData.height - 1) this.#displacement.y = endingPoint.y + this.#mapData.height - 1

        Icamera.p = this.#startingPoint.add(this.#displacement).add(vec(0.5, 0.5)).mlt(gridSize)
    }

    #decideEndingPoint() {
        if (keyboard.pushed.has("ShiftLeft")) {
            // console.log(this)

            // 矩形領域を切り取る
            this.#selectGrid = this.#grid
                .slice(this.#startingPoint.y, this.#startingPoint.y + this.#displacement.y)
                .map((row) => row.slice(this.#startingPoint.x, this.#startingPoint.x + this.#displacement.x))

            // console.log(this.#selectGrid)

            this.#step = "move"
            this.#displacement = vec(0, 0)
        }
    }

    #putRectangle() {
        if (keyboard.pushed.has("ShiftLeft")) {
            // 元の部分を00で埋める
            this.#embedRectangle(
                this.#grid,
                this.#selectGrid.map((row) => row.map((tileId) => "00")),
                this.#startingPoint,
            )
            this.#embedRectangle(this.#grid, this.#selectGrid, this.#startingPoint.add(this.#displacement))

            console.log(this.#grid)
            this.#step = "end"
        }
    }

    // 矩形領域を埋め込む
    #embedRectangle(targetGrid, sourceGrid, position) {
        const height = sourceGrid.length
        const width = sourceGrid[0]?.length || 0

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const targetY = position.y + y
                const targetX = position.x + x

                if (targetY < targetGrid.length && targetX < targetGrid[targetY].length) {
                    targetGrid[targetY][targetX] = sourceGrid[y][x]
                }
            }
        }
    }
})()

const phasePaint = new (class {
    constructor() {}
    start() {}
    loop() {}
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
