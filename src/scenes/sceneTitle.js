const sceneTitle = new (class {
    #command
    #frame
    #mode

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "dot",
            60,
            "azure",
            [width / 2, height / 2 + 160],
            new IDict({
                "": [
                    "#{colour}{red}始#{colour}{azure}めから",
                    "#{colour}{red}続#{colour}{azure}きから",
                    "#{colour}{red}終#{colour}{white}わる",
                ],
                "2": ["はい", "!いいえ"],
            }),
            {
                titleDict: new IDict({ "2": "ほんとに?" }),
                textAlign: "center",
                maxLineNumDict: new IDict({ ".*": 3 }),
            },
        )
    }

    start() {
        this.#mode = "normal"

        this.#frame = 0

        this.#command.optionDict.dict["1"] = savedataList.map((_, i) => "/" + i)
        this.#command.reset()

        this.#command.frame = -80
    }

    loop() {
        this.#frame++

        Irect(ctxMain, "#111", [0, 0], [width, height])

        switch (this.#mode) {
            case "normal": {
                this.#modeNormal()
                break
            }
            case "save": {
                this.#modeSave()
                break
            }
        }
    }

    #modeNormal() {
        const progress = Math.min(this.#frame / 90, 1)
        const x = 800 * (1 - progress) ** 2

        ctxMain.save()
        ctxMain.translate(0, (1 - progress) ** 2 * 20)
        ctxMain.globalAlpha = progress

        Igear(ctxMain, width / 2 + x, height / 2 - 200, "#f0ffff80", 30, 13, 20, {
            lineWidth: 2,
            theta: this.#frame / 240,
        })

        Iarc(ctxMain, "#f0ffff80", width / 2 + x, height / 2 - 200, 60, { lineWidth: 2 })

        Itext(ctxMain, "red", "dot", 90, [80, 80], "欠#{colour}{azure}けた歯車のセレナーデ", {
            frame: (this.#frame - 80) / 9,
            transparent: true,
        })

        this.#command.run()

        if (this.#command.isMatch("0")) {
            sceneMain.loadSaveData(new SaveData("test", 0, vec(0, 0), []))
            changeScene(sceneMain, 2500)
        } else if (this.#command.isMatch("1")) {
            this.#mode = "save"
            this.#frame = 0
        } else if (this.#command.isMatch("21")) {
            this.#command.cancel(2)
        } else if (this.#command.isMatch("20")) {
            window.close()
        }

        ctxMain.restore()
    }

    #modeSave() {
        const progress = Math.min(this.#frame / 10, 1)

        ctxMain.save()
        ctxMain.translate(0, (1 - progress) ** 2 * 20)
        ctxMain.globalAlpha = progress

        this.#command.run()

        Itext(ctxMain, "azure", "dot", 48, [80, 80], "どのデータで遊ぶ?")

        const position = this.#command.position

        savedataList.slice(position, position + 3).forEach((s, i) => {
            this.#command.overrideButton(
                i,
                Ibutton(ctxMain, "azure", "dot", 48, [100, 200 + 270 * i], [width - 200, 230], ""),
            )

            Itext(ctxMain, "azure", "dot", 48, [130, 220 + 270 * i], "Data" + (i + position))
            Itext(ctxMain, "azure", "dot", 48, [130, 290 + 270 * i], "MapId: " + s.mapId)
            Itext(
                ctxMain,
                "azure",
                "dot",
                48,
                [130, 360 + 270 * i],
                "プレイ時間: " + playTimeManager.formatPlayTime(s.playTime),
            )
        })

        Irect(ctxMain, "red", [100, 200 + (this.#command.num - position) * 270], [width - 200, 230], {
            lineWidth: 4,
            shadowColour: "azure",
            shadowBlur: 20,
        })

        const [topNeed, bottomNeed] = this.#command.getDotNeeds()

        if (topNeed) Itext(ctxMain, "azure", "dot", 48, [690, 130], "▲")

        if (bottomNeed) Itext(ctxMain, "azure", "dot", 48, [690, 980], "▼")

        if (!this.#command.isMatch("1")) {
            this.#mode = "normal"
        }

        if (this.#command.isMatch("1.")) {
            sceneMain.loadSaveData(savedataList[this.#command.getSelectedNum(1)])
            changeScene(sceneMain, 2500)
        }

        ctxMain.restore()
    }
})()
