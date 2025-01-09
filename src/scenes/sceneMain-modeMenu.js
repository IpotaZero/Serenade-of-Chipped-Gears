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
