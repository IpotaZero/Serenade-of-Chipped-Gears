const sceneEdit = new (class {
    #grid
    #cursor
    #mode
    #command
    #brushTileId
    #pickedSprite
    #backgroundCtx
    #frame

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "dot",
            80,
            "azure",
            [1200, 60],
            new IDict({
                "": ["0-", "1-"],
            }),
            { maxLineNumDict: new IDict({ ".*": 9 }), titleDict: new IDict({ "": "tileId" }), se: false },
        )
    }

    start() {
        this.#command.optionDict.dict["0"] = Object.keys(mapTile).filter((key) => key.startsWith("0"))
        this.#command.optionDict.dict["1"] = Object.keys(mapTile).filter((key) => key.startsWith("1"))
        this.#command.reset()

        this.#backgroundCtx = mapManager.background.getContext("2d")
        this.#backgroundCtx.imageSmoothingEnabled = false
        this.#grid = []
        this.#cursor = playerManager.p

        this.#normalizeGrid()

        this.#brushTileId = "00"
        this.#pickedSprite = null

        this.#mode = "paint"

        this.#frame = 0
    }

    #normalizeGrid() {
        const tiles = mapData.grid.replaceAll(/ |\n/g, "").match(/.{2}/g)

        for (let i = 0; i < mapData.height; i++) {
            const row = tiles.slice(mapData.width * i, mapData.width * (i + 1))
            this.#grid.push(row)
        }
    }

    loop() {
        drawHandler.loop()

        ctxMain.save()
        const progress = 1 - (1 - Math.min(1, this.#frame / 10)) ** 2
        ctxMain.globalAlpha = progress
        ctxMain.translate(0, (1 - progress) * 20)
        this.#frame++

        switch (this.#mode) {
            case "paint": {
                this.#modePaint()
                break
            }
            case "rectangle": {
                this.#modeRectangle()
                break
            }
            case "select": {
                this.#modeSelect()
                break
            }
        }

        ctxMain.restore()

        if (keyboard.pushed.has("Escape")) {
            changeScene(sceneMain, 100)
        }
    }

    #modePaint() {
        this.#controlCursor()
        this.#displaySelectGridTile()
        this.#displaySelectGridSprite()
        this.#displayCurrentBrush()
        this.#handleRange()

        this.#draw()

        //
        if (keyboard.pushed.has("KeyX")) {
            this.#mode = "select"
        } else if (keyboard.longPressed.has("KeyZ")) {
            this.#paint(this.#cursor.x, this.#cursor.y)
        } else if (keyboard.pushed.has("KeyB")) {
            this.#splashBucket(this.#grid[this.#cursor.y][this.#cursor.x], this.#cursor.x, this.#cursor.y)
        } else if (keyboard.pushed.has("KeyC")) {
            this.#pickupSprite()
        } else if (keyboard.pushed.has("ShiftLeft")) {
            this.#mode = "rectangle"
            modeRectangle.start({
                startingPoint: this.#cursor,
                grid: this.#grid,
            })
        } else if (keyboard.ctrlKey && keyboard.pushed.has("KeyS")) {
            this.#saveMapData()
        } else if (keyboard.pushed.has("KeyS")) {
            this.#brushTileId = this.#grid[this.#cursor.y][this.#cursor.x]
        }
    }

    #handleRange() {
        Irect(ctxMain, "#11111180", [930, 40], [480, 190], { lineColor: "azure" })

        Itext(ctxMain, "azure", "dot", 60, [1200, 60], `width: `, { textAlign: "right" })
        Itext(ctxMain, "azure", "dot", 60, [1200, 140], `height: `, { textAlign: "right" })

        const rw = Irange(ctxMain, "azure", "dot", 60, [1200, 60], mapManager.mapData.width)
        const rh = Irange(ctxMain, "azure", "dot", 60, [1200, 140], mapManager.mapData.height)

        if (rw == 1) {
            mapManager.mapData.width++

            this.#grid.forEach((row) => {
                row.push("00")
            })

            this.#updateMap()
        } else if (rw == -1) {
            mapManager.mapData.width--

            this.#grid.forEach((row) => {
                row.pop()
            })

            this.#updateMap()
        } else if (rh == 1) {
            mapManager.mapData.height++

            this.#grid.push(Array(mapManager.mapData.width).fill("00"))

            this.#updateMap()
        } else if (rh == -1) {
            mapManager.mapData.height--

            this.#grid.pop()

            this.#updateMap()
        }
    }

    #updateMap() {
        mapManager.mapData.grid = this.#grid.flat(2).join("")
        mapManager.reset()
        mapManager.drawBackground()
    }

    #saveMapData() {
        this.#updateMap()

        electron.writeMapData(mapManager.mapData.id, `mapData = ${objectToJsString(mapManager.mapData)}`)

        new Ianimation(2000).start((x) => {
            Itext(
                ctxMain,
                `hsl(0,100%,100%,${(1 - x) * 100}%)`,
                "dot",
                96,
                [width, height - 96],
                `${mapManager.mapData.id} is saved!`,
                { textAlign: "right" },
            )
        })
    }

    #paint(x, y) {
        this.#grid[y][x] = this.#brushTileId

        const image = tileImageCache.get(this.#brushTileId)
        image.draw(this.#backgroundCtx, [gridSize * x, gridSize * y], [gridSize, gridSize])

        // update walkable grid
        const positionString = `${x},${y}`
        mapManager.unWalkableGrid.add(positionString)
        if (mapTile[this.#brushTileId][0] != "!") mapManager.unWalkableGrid.delete(positionString)
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
            const row = this.#grid[y + w]
            if (!row) return

            const tile = row[x + z]
            if (!tile) return

            if (tile == targetTile) this.#splashBucket(targetTile, x + z, y + w)
        })
    }

    #pickupSprite() {
        // put
        if (this.#pickedSprite) {
            this.#pickedSprite[1] = this.#cursor.l
            this.#pickedSprite = null

            mapManager.reset()

            return
        }

        // pickup
        this.#whenCursorTouchSprite((s) => {
            this.#pickedSprite = s
        })
    }

    #modeRectangle() {
        const response = modeRectangle.loop()

        if (response == "end") {
            this.#updateMap()
            this.#mode = "paint"
        }
    }

    #whenCursorTouchSprite(callback) {
        mapManager.mapData.sprites.forEach((s) => {
            ILoop([1, 1], s[2]?.size ?? [1, 1], (x, y) => {
                if (this.#cursor.x == s[1][0] + x - 1 && this.#cursor.y == s[1][1] + y - 1) {
                    callback(s)
                }
            })
        })
    }

    #modeSelect() {
        Irect(ctxMain, "#11111180", [1100, 40], [300, 1010], { lineColor: "azure" })

        if (this.#command.branch == "" && keyboard.pushed.has("KeyX")) {
            this.#mode = "paint"
        }

        this.#command.run()

        if (this.#command.isMatch(".")) {
            const tileIdList = Object.keys(mapTile).filter((key) => key.startsWith(this.#command.branch))

            tileIdList.slice(this.#command.position, this.#command.position + 9).forEach((tileId, i) => {
                tileImageCache.get(tileId).draw(ctxMain, [1300, 230 + i * 80], [60, 60])
            })
        } else if (this.#command.isMatch("..")) {
            this.#brushTileId = this.#command.getSelectedOption()
            this.#command.cancel(1)
            this.#mode = "paint"
        }
    }

    #controlCursor() {
        const v = getArrowKeyAction("longPressed")

        this.#cursor = this.#cursor.add(v)

        // カーソルが画面外に行かないように
        if (this.#cursor.x < 0) this.#cursor.x = 0
        if (this.#cursor.y < 0) this.#cursor.y = 0
        if (this.#cursor.x > mapManager.mapData.width - 1) this.#cursor.x = mapManager.mapData.width - 1
        if (this.#cursor.y > mapManager.mapData.height - 1) this.#cursor.y = mapManager.mapData.height - 1

        // カーソルを画面の真ん中に
        Icamera.p = this.#cursor.add(vec(0.5, 0.5)).mlt(gridSize)
    }

    #displaySelectGridTile() {
        Irect(ctxMain, "#11111180", [40, 40], [300, 300], { lineColor: "azure" })

        const tileId = this.#grid[this.#cursor.y][this.#cursor.x]

        if (!tileId) return

        const tileImage = tileImageCache.get(tileId)
        tileImage.draw(ctxMain, [60, 60], [gridSize, gridSize])

        Itext(ctxMain, "azure", "dot", 32, [160, 60], `tileId: ${tileId}`)
        Itext(ctxMain, "azure", "dot", 32, [160, 100], `x: ${this.#cursor.x},y: ${this.#cursor.y}`)
    }

    #displaySelectGridSprite() {
        Irect(ctxMain, "#11111180", [40, 400], [300, 300], { lineColor: "azure" })

        this.#whenCursorTouchSprite((s) => {
            const size = s[2]?.size ?? [1, 1]

            Itext(ctxMain, "azure", "dot", 32, [65, 420], `spriteType: ${s[0]}`)
            Itext(ctxMain, "azure", "dot", 32, [65, 460], `size: [${size}]`)

            if (s[2] && s[2].image) {
                spriteImageCache
                    .get(s[2].image[s[2].direction ?? "down"].join())
                    .draw(ctxMain, [60, 500], [gridSize * size[0], gridSize * size[1]])
            }
        })
    }

    #displayCurrentBrush() {
        Irect(ctxMain, "#11111180", [40, 760], [300, 300], { lineColor: "azure" })

        const tileImage = tileImageCache.get(this.#brushTileId)
        tileImage.draw(ctxMain, [60, 780], [gridSize, gridSize])

        Itext(ctxMain, "azure", "dot", 32, [160, 780], `tileId: ${this.#brushTileId}`)
    }

    #draw() {
        Icamera.run(ctxMain, () => {
            this.#drawCursor()
        })
    }

    #drawCursor() {
        Irect(ctxMain, "azure", this.#cursor.mlt(gridSize).l, [gridSize, gridSize], {
            lineWidth: 2,
        })
    }
})()

const modeRectangle = new (class {
    #startingPoint = vec(0, 0)
    #displacement = vec(0, 0)
    #grid = [[]]
    #phase = "decide"
    #selectGrid

    constructor() {}

    start({ startingPoint, grid }) {
        this.#startingPoint = startingPoint
        this.#displacement = vec(1, 1)
        this.#grid = grid
        this.#phase = "decide"
    }

    loop() {
        switch (this.#phase) {
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

        Irect(ctxMain, "azure", this.#startingPoint.mlt(gridSize).l, this.#displacement.mlt(gridSize).l, {
            lineWidth: 4,
            lineDash: [4, 4],
        })

        ctxMain.restore()
    }

    #displayMovingGrid() {
        ctxMain.save()
        ctxMain.translate(-Icamera.p.x + width / 2, -Icamera.p.y + height / 2)

        Irect(ctxMain, "azure", this.#startingPoint.add(this.#displacement).mlt(gridSize).l, [gridSize, gridSize], {
            lineWidth: 4,
            lineDash: [4, 4],
        })

        ctxMain.restore()
    }

    #controlDisplacement() {
        const v = getArrowKeyAction("longPressed")

        this.#displacement = this.#displacement.add(v)

        const endingPoint = this.#startingPoint.add(this.#displacement)

        // カーソルが画面外に行かないように
        if (endingPoint.x < 0) this.#displacement.x = -this.#startingPoint.x
        if (endingPoint.y < 0) this.#displacement.y = -this.#startingPoint.y
        if (endingPoint.x > mapManager.mapData.width - 1)
            this.#displacement.x = endingPoint.x + mapManager.mapData.width - 1
        if (endingPoint.y > mapManager.mapData.height - 1)
            this.#displacement.y = endingPoint.y + mapManager.mapData.height - 1

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

            this.#phase = "move"
            this.#displacement = vec(0, 0)
        }
    }

    #putRectangle() {
        if (keyboard.pushed.has("KeyX")) {
            // 移動
            // 元の部分を00で埋める
            this.#embedRectangle(
                this.#grid,
                this.#selectGrid.map((row) => row.map((tileId) => "00")),
                this.#startingPoint,
            )

            this.#embedRectangle(this.#grid, this.#selectGrid, this.#startingPoint.add(this.#displacement))
            this.#phase = "end"
        } else if (keyboard.pushed.has("KeyC")) {
            // コピー
            this.#embedRectangle(this.#grid, this.#selectGrid, this.#startingPoint.add(this.#displacement))
            this.#phase = "end"
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
