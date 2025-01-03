const sceneMain = new (class {
    #frame
    #mode
    #player
    #menuCommand
    #gridSize
    #background

    constructor() {
        this.mapId = "test"
        this.map = mapData[this.mapId]

        // たぶん72
        this.#gridSize = width / 18

        this.#player = {
            p: vec(0, 0),
            displayP: vec(0, 0),
            previousP: vec(0, 0),
            direction: "down",
            moveIntervalCount: 0,
            moveInterval: 10,
            image: new Iimage("images/dot_taro.png"),
        }

        this.#frame = 0

        this.#mode = "move"

        this.#menuCommand = new Icommand(
            ctxMain,
            "dot",
            48,
            "azure",
            20,
            220,
            new IDict({
                "": ["アイテム", "装備", "セーブ", "終了"],
                "1": ["Taro", "Shun"],
                "1.": ["_頭", "_体", "_脚", "_靴"],
                "3": ["はい", "!いいえ"],
            }),
            { titles: new IDict({ "3": "ほんとに?" }) },
        )
    }

    async start() {
        this.mode = "loading"

        this.map = mapData[this.mapId]

        this.#background = document.createElement("canvas")
        const [column, row] = [this.map.width, this.map.height]

        this.#background.width = this.#gridSize * column
        this.#background.height = this.#gridSize * row
        const ctx = this.#background.getContext("2d")

        const tileCache = new Map()

        await ILoop([0, 0], [column, row], async (x, y) => {
            const tile = this.map.grid[x + row * y]

            if (!tileCache.has(tile)) {
                const image = new Iimage(`images/mapTiles/${mapTile[tile]}.png`)
                await image.loaded

                tileCache.set(tile, image)
            }

            const tileImage = tileCache.get(tile)

            tileImage.draw(ctx, this.#gridSize * x, this.#gridSize * y, this.#gridSize, this.#gridSize)
        })

        tileCache.clear()

        this.mode = "move"
    }

    loop() {
        switch (this.#mode) {
            case "loading":
                this.#modeLoading()
                break
            case "move":
                this.#modeMove()
                break
            case "menu":
                this.#modeMenu()
                break
            case "event":
                this.#modeEvent()
                break
        }

        this.#frame++
    }

    #modeLoading() {
        return
        Irect(ctxMain, "#111", 0, 0, width, height)
        Itext(ctxMain, "azure", "dot", 48, width, height / 2, "なうろーでぃんぐ...", { text_align: "right" })
    }

    #modeMove() {
        if (keyboard.pushed.has("cancel")) this.#mode = "menu"

        this.#controlPlayer()
        this.#draw()

        const gap = this.#player.p.sub(this.#player.displayP)

        const isEndPlayerMove = gap.length() < 0.1

        if (!isEndPlayerMove) return

        this.#resolveSpriteAction()
    }

    #draw() {
        Irect(ctxMain, "#111", 0, 0, width, height)

        this.#player.displayP = this.#player.previousP.add(
            this.#player.p
                .sub(this.#player.previousP)
                .mlt(1 - this.#player.moveIntervalCount / this.#player.moveInterval),
        )

        this.#updateCameraState()

        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        this.#drawMap()
        this.#drawPlayer()

        ctxMain.restore()
    }

    #updateCameraState() {
        // Icamera.run(this.#player.displayP.mlt(this.#gridSize))
        Icamera.p = this.#player.displayP.mlt(this.#gridSize)

        if (Icamera.p.x < width / 2) Icamera.p.x = width / 2
        if (Icamera.p.y < height / 2) Icamera.p.y = height / 2
        if (Icamera.p.x > this.#gridSize * this.map.width - width / 2)
            Icamera.p.x = this.#gridSize * this.map.width - width / 2
        if (Icamera.p.y > this.#gridSize * this.map.height - height / 2)
            Icamera.p.y = this.#gridSize * this.map.height - height / 2
    }

    #drawMap() {
        // background
        ctxMain.drawImage(this.#background, 0, 0)

        // sprites
        this.map.sprites.forEach((sprite) => {
            Iarc(
                ctxMain,
                "blue",
                this.#gridSize * (sprite.x + 0.5),
                this.#gridSize * (sprite.y + 0.5),
                this.#gridSize / 4,
            )
        })
    }

    #drawPlayer() {
        this.#player.image.draw(
            ctxMain,
            this.#gridSize * this.#player.displayP.x,
            this.#gridSize * (this.#player.displayP.y - 1),
            this.#gridSize,
            this.#gridSize * 2,
        )
    }

    #controlPlayer() {
        if (this.#player.moveIntervalCount > 0) {
            this.#player.moveIntervalCount--
            return
        }

        const v = vec(0, 0)

        if (keyboard.pressed.has("ArrowRight")) {
            this.#player.direction = "right"
            v.x += 1
        }
        if (keyboard.pressed.has("ArrowLeft")) {
            this.#player.direction = "left"
            v.x -= 1
        }
        if (keyboard.pressed.has("ArrowUp")) {
            this.#player.direction = "up"
            v.y -= 1
        }
        if (keyboard.pressed.has("ArrowDown")) {
            this.#player.direction = "down"
            v.y += 1
        }

        if (v.length() > 0) {
            // 目の前に壁となるスプライトがあるか?
            let walkable = true

            this.map.sprites.forEach((sprite) => {
                if (sprite.walkable) return
                const nextP = this.#player.p.add(v)
                const isSameGrid = nextP.x == sprite.x && nextP.y == sprite.y
                if (isSameGrid) walkable = false
            })

            if (walkable) {
                this.#player.previousP = this.#player.p
                this.#player.p = this.#player.p.add(v)
                this.#player.moveIntervalCount = this.#player.moveInterval
            }
        }

        // 端
        if (this.#player.p.x < 0) this.#player.p.x = 0
        if (this.#player.p.y < 0) this.#player.p.y = 0
        if (this.#player.p.x > this.map.width - 1) this.#player.p.x = this.map.width - 1
        if (this.#player.p.y > this.map.height - 1) this.#player.p.y = this.map.height - 1
    }

    #resolveSpriteAction() {
        this.map.sprites.forEach((sprite) => {
            // 周囲8マスのみ確認
            if (vec(sprite.x, sprite.y).sub(this.#player.p).length() > 1.5) return

            const isSameGrid = sprite.x == this.#player.p.x && sprite.y == this.#player.p.y

            const directionGrid = this.#player.p.add(
                {
                    right: vec(1, 0),
                    left: vec(-1, 0),
                    up: vec(0, -1),
                    down: vec(0, 1),
                }[this.#player.direction],
            )

            const isLooking = directionGrid.x == sprite.x && directionGrid.y == sprite.y

            switch (sprite.type) {
                case "move": {
                    if (isSameGrid && this.#player.direction == sprite.direction) {
                        changeScene(sceneMain, 1000)
                        this.mapId = sprite.mapId
                        ;[this.#player.p.x, this.#player.p.y] = sprite.position
                        ;[this.#player.displayP.x, this.#player.displayP.y] = sprite.position
                        ;[this.#player.previousP.x, this.#player.previousP.y] = sprite.position
                        Icamera.p = this.#player.p.add(vec(0.5, 0.5)).mlt(this.#gridSize)
                    }
                    break
                }
                case "talk": {
                    if (isLooking) {
                        if (!keyboard.pushed.has("ok")) return

                        this.#mode = "event"
                        eventHandler.generator = sprite.event()
                        eventHandler.start()
                    }
                    break
                }
            }
        })
    }

    #modeMenu() {
        this.#draw()

        Irect(ctxMain, "#111111c0", 0, 0, width, height)

        Itext(ctxMain, "azure", "dot", 48, 60, 100, "現在地: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 100, "プレイ時間: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 150, "目的: ")

        if (keyboard.pushed.has("cancel") && this.#menuCommand.branch == "") this.#mode = "move"

        this.#menuCommand.run()

        if (this.#menuCommand.is_match("30")) {
            this.#menuCommand.reset()
            changeScene(sceneTitle, 1000)
        } else if (this.#menuCommand.is_match("31")) {
            this.#menuCommand.cancel(2)
        }
    }

    #modeEvent() {
        this.#draw()

        const isEnd = eventHandler.loop()

        if (isEnd) {
            this.#mode = "move"
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
        )
    }

    start() {
        this.#next()
        this.#isWaitingForInput = true
    }

    async #next(response) {
        this.#isWaitingForInput = false
        this.#frame = 0

        const { value, done } = await this.generator.next(response)

        this.#currentText = value

        if (!done && typeof this.#currentText != "string" && this.#currentText[0] == "question") {
            this.#command.options.dict[""] = this.#currentText[1]
            this.#command.titles.dict[""] = this.#currentText[2] ?? ""
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
        Irect(ctxMain, "#111111f0", 20, 760, width - 40, 295)
        Irect(ctxMain, "azure", 20, 760, width - 40, 295, {
            line_width: 2,
        })

        const blink = this.#frame % 60 < 30 ? "#{colour}{azure}▼" : ""

        const isEnd = Itext(ctxMain, "azure", "dot", 48, 40, 780, this.#currentText + blink, {
            frame: this.#frame++ / 3,
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
                        this.#command.reset()
                    }
                }
                break
        }
    }
})()
