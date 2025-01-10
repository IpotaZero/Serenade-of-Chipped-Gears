const modeEdit = new (class {
    #grid
    #cursor
    #mapData
    #phase
    #command
    #brushTileId
    #pickedSprite
    #backgroundCtx
    #unWalkableGrid
    #frame

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

    start({ mapData, playerP, background, unWalkableGrid }) {
        this.#command.options.dict[""] = Object.keys(mapTile)

        this.#backgroundCtx = background.getContext("2d")
        this.#backgroundCtx.imageSmoothingEnabled = false
        this.#mapData = mapData
        this.#grid = []
        this.#cursor = playerP
        this.#unWalkableGrid = unWalkableGrid

        this.#normalizeGrid()

        this.#brushTileId = "00"
        this.#pickedSprite = null

        this.#phase = "paint"

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
        ctxMain.save()
        const progress = 1 - (1 - Math.min(1, this.#frame / 10)) ** 2
        ctxMain.globalAlpha = progress
        ctxMain.translate(0, (1 - progress) * 20)
        this.#frame++

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

        ctxMain.restore()

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
        } else if (keyboard.pushed.has("KeyS")) {
            this.#brushTileId = this.#grid[this.#cursor.y][this.#cursor.x]
        }
    }

    #handleRange() {
        Irect(ctxMain, "#11111180", 930, 40, 480, 190)
        Irect(ctxMain, "azure", 930, 40, 480, 190, { lineWidth: 2 })

        Itext(ctxMain, "azure", "dot", 60, 1200, 60, `width: `, { textAlign: "right" })
        Itext(ctxMain, "azure", "dot", 60, 1200, 140, `height: `, { textAlign: "right" })

        const rw = Irange(ctxMain, "azure", "dot", 60, 1200, 60, this.#mapData.width)
        const rh = Irange(ctxMain, "azure", "dot", 60, 1200, 140, this.#mapData.height)

        if (rw == 1) {
            this.#mapData.width++

            this.#grid.forEach((row) => {
                row.push("00")
            })
        } else if (rw == -1) {
            this.#mapData.width--

            this.#grid.forEach((row) => {
                row.pop()
            })
        } else if (rh == 1) {
            this.#mapData.height++

            this.#grid.push(Array(this.#mapData.width).fill("00"))
        } else if (rh == -1) {
            this.#mapData.height--

            this.#grid.pop()
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

        const image = tileImageCache.get(this.#brushTileId)
        image.draw(this.#backgroundCtx, [gridSize * x, gridSize * y], [gridSize, gridSize])

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
        Irect(ctxMain, "azure", 1100, 40, 300, 1010, { lineWidth: 2 })
        this.#command.run()

        let index = 0
        for (const tileId in mapTile) {
            const num = index - this.#command.position
            if (0 <= num && num < 11 && tileImageCache.has(tileId)) {
                tileImageCache.get(tileId).draw(ctxMain, [1300, 150 + num * 80], [60, 60])
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

        // カーソルを画面の真ん中に
        Icamera.p = this.#cursor.add(vec(0.5, 0.5)).mlt(gridSize)
    }

    #displaySelectGridTile() {
        Irect(ctxMain, "#11111180", 40, 40, 300, 300)
        Irect(ctxMain, "azure", 40, 40, 300, 300, { lineWidth: 2 })

        const tileId = this.#grid[this.#cursor.y][this.#cursor.x]

        if (!tileId) return

        const tileImage = tileImageCache.get(tileId)
        tileImage.draw(ctxMain, [60, 60], [gridSize, gridSize])

        Itext(ctxMain, "azure", "dot", 32, 160, 60, `tileId: ${tileId}`)
        Itext(ctxMain, "azure", "dot", 32, 160, 100, `x: ${this.#cursor.x},y: ${this.#cursor.y}`)
    }

    #displaySelectGridSprite() {
        Irect(ctxMain, "#11111180", 40, 400, 300, 300)
        Irect(ctxMain, "azure", 40, 400, 300, 300, { lineWidth: 2 })

        this.#whenCursorTouchSprite((s) => {
            const size = s[2]?.size ?? [1, 1]

            Itext(ctxMain, "azure", "dot", 32, 65, 420, `spriteType: ${s[0]}`)
            Itext(ctxMain, "azure", "dot", 32, 65, 460, `size: [${size}]`)

            if (s[2] && s[2].image) {
                spriteImageCache
                    .get(s[2].image[s[2].direction ?? "down"].join())
                    .draw(ctxMain, [60, 500], [gridSize * size[0], gridSize * size[1]])
            }
        })
    }

    #displayCurrentBrush() {
        Irect(ctxMain, "#11111180", 40, 760, 300, 300)
        Irect(ctxMain, "azure", 40, 760, 300, 300, { lineWidth: 2 })

        const tileImage = tileImageCache.get(this.#brushTileId)
        tileImage.draw(ctxMain, [60, 780], [gridSize, gridSize])

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
            lineWidth: 2,
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
            { lineWidth: 4, lineDash: [4, 4] },
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
            { lineWidth: 4, lineDash: [4, 4] },
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

            // console.log(this.#grid)
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
