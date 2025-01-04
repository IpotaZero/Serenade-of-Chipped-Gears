const sceneMain = new (class {
    #frame
    #mode
    #player
    #gridSize
    #background
    #map
    #unWalkableGrid

    constructor() {
        this.mapId = "test"
        this.#map = mapData[this.mapId]

        this.#unWalkableGrid = []

        // たぶん72
        this.#gridSize = width / 18

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

        this.#map = mapData[this.mapId]

        await this.#drawBackground()

        this.#mode = "move"
    }

    async #drawBackground() {
        this.#background = document.createElement("canvas")
        const [column, row] = [this.#map.width, this.#map.height]

        this.#background.width = this.#gridSize * column
        this.#background.height = this.#gridSize * row
        const ctx = this.#background.getContext("2d")

        const tileCache = new Map()

        await AsyncILoop([0, 0], [column - 1, row - 1], async (x, y) => {
            const tile = this.#map.grid.slice(2 * (x + column * y), 2 * (x + column * y) + 2)

            let [path, option] = mapTile[tile].split("/")
            if (path[0] == "!") {
                path = path.substring(1)
                this.#unWalkableGrid.push(`${x},${y}`)
            }

            if (!tileCache.has(tile)) {
                const image = new Iimage(`images/mapTiles/${path}.png`, ...(option ?? "0,0").split(","), 16, 16)
                await image.loaded

                tileCache.set(tile, image)
            }

            const tileImage = tileCache.get(tile)

            tileImage.draw(ctx, this.#gridSize * x, this.#gridSize * y, this.#gridSize, this.#gridSize)
        })

        tileCache.clear()
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

        if (keyboard.pushed.has("cancel") && menuHandler.menuCommand.branch == "") this.#mode = "move"

        menuHandler.loop()
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
    constructor() {
        this.menuCommand = new Icommand(
            ctxMain,
            "dot",
            48,
            "azure",
            20,
            220,
            new IDict({
                "": ["アイテム", "装備", "セーブ", "#{colour}{red}終了"],
                "1": ["/Taro", "/Shun"],
                "1.": ["/頭", "/体", "/脚", "/靴"],
                "2": ["/0", "/1", "/2"],
                "3": ["はい", "!いいえ"],
            }),
            { titles: new IDict({ "3": "ほんとに?" }) },
        )
    }

    loop() {
        Irect(ctxMain, "#111111c0", 0, 0, width, height)

        this.menuCommand.run()

        Itext(ctxMain, "azure", "dot", 48, 60, 100, "現在地: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 100, "プレイ時間: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 150, "目的: ")

        if (!this.menuCommand.is_match("2")) {
            for (let i = 0; i < 2; i++) {
                Irect(ctxMain, "#111c", 400, 270 + i * 300, 1000, 250)
                Irect(ctxMain, "azure", 400, 270 + i * 300, 1000, 250, { line_width: 2 })
            }
        }

        if (this.menuCommand.is_match("1")) {
            const num = this.menuCommand.num
            Irect(ctxMain, "azure", 400, 270 + num * 300, 1000, 250, { line_width: 8 })
        } else if (this.menuCommand.is_match("2")) {
            Irect(ctxMain, "#111c", 40, 270, 1360, 250)
            Irect(ctxMain, "azure", 40, 270, 1360, 250, { line_width: 2 })
        } else if (this.menuCommand.is_match("30")) {
            this.menuCommand.reset()
            changeScene(sceneTitle, 1000)
        } else if (this.menuCommand.is_match("31")) {
            this.menuCommand.cancel(2)
        }
    }
})()
