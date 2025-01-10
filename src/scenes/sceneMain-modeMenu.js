const modeMenu = new (class {
    #menuCommand
    #phase
    #endingFrame

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
                "2.": ["セーブする", "ロードする", "削除する"],
                "3": ["はい", "!いいえ"],
            }),
            { titles: new IDict({ "2": "セーブデータを;選択", "3": "ほんとに?" }) },
        )
    }

    start() {
        this.#menuCommand.reset()

        this.#menuCommand.options.dict["2"] = savedataList.map((_, i) => "/" + i)
        this.#menuCommand.options.dict["2"].push("/empty")

        this.#phase = "running"

        this.#endingFrame = 10
    }

    #getProgress() {
        let progress = 1 - (1 - Math.min(1, this.#menuCommand.frame / 10)) ** 2

        if (this.#phase == "ending") progress = (this.#endingFrame / 10) ** 2

        return progress
    }

    loop({ mapName }) {
        if (this.#phase == "ending") {
            this.#endingFrame--
            if (this.#endingFrame == 0) {
                inputHandler.canInput = true
                return "move"
            }
        }

        Irect(ctxMain, "#111111c0", 0, 0, width, height)

        if (keyboard.pushed.has("cancel") && this.#menuCommand.branch == "") {
            this.#phase = "ending"
            inputHandler.canInput = false
        }

        const progress = this.#getProgress()

        ctxMain.save()
        ctxMain.globalAlpha = progress
        ctxMain.translate(0, (1 - progress) * 20)

        this.#menuCommand.run()

        Itext(ctxMain, "azure", "dot", 48, 60, 100, `現在地: ${mapName}`)
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 100, "プレイ時間: ")
        Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 150, "目的: ")

        if (!this.#menuCommand.is_match("2|1.")) {
            for (let i = 0; i < 2; i++) {
                Irect(ctxMain, "#111c", 400, 270 + i * 270, 1000, 250)
                Irect(ctxMain, "azure", 400, 270 + i * 270, 1000, 250, { lineWidth: 2 })
            }
        }

        if (this.#menuCommand.is_match("1")) {
            const num = this.#menuCommand.num
            Irect(ctxMain, "azure", 400, 270 + num * 300, 1000, 250, { lineWidth: 8 })
        } else if (this.#menuCommand.is_match("1.")) {
            const num = this.#menuCommand.num
            const text = ["なし", "セーター", "ジーンズ", "ボロボロの靴"][num]
            Itext(ctxMain, "azure", "dot", 48, width / 2 + 60, 270, text)
        } else if (this.#menuCommand.is_match("2")) {
            savedataList.forEach((s, i) => {
                Irect(ctxMain, "#111c", 400, 270 + i * 270, 1000, 250)
                Irect(ctxMain, "azure", 400, 270 + i * 270, 1000, 250, { lineWidth: 2 })

                Itext(ctxMain, "azure", "dot", 48, 440, 300 + i * 270, `Data${i}`)
                Itext(ctxMain, "azure", "dot", 48, 440, 370 + i * 270, `MapId: ${s.mapId}`)
                Itext(ctxMain, "azure", "dot", 48, 440, 440 + i * 270, `プレイ時間: ${s.playTime}`)
            })

            const length = savedataList.length

            Irect(ctxMain, "#111c", 400, 270 + length * 270, 1000, 250)
            Irect(ctxMain, "azure", 400, 270 + length * 270, 1000, 250, { lineWidth: 2 })
            Itext(ctxMain, "azure", "dot", 48, 440, 290 + length * 270, `empty data`)

            const num = this.#menuCommand.num
            Irect(ctxMain, "azure", 400, 270 + num * 270, 1000, 250, {
                lineWidth: 4,
                shadowColour: "azure",
                shadowBlur: 20,
            })
        } else if (this.#menuCommand.is_match("2.0")) {
            const savedata = new SaveData()
            this.#menuCommand.cancel(3)
        } else if (this.#menuCommand.is_match("30")) {
            this.#menuCommand.reset()
            changeScene(sceneTitle, 1000)
        } else if (this.#menuCommand.is_match("31")) {
            this.#menuCommand.cancel(2)
        } else if (this.#menuCommand.is_match("4")) {
            this.#menuCommand.reset()
            ctxMain.restore()
            return "edit"
        }

        ctxMain.restore()
    }
})()
