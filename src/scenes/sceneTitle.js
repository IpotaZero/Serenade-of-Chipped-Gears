const sceneTitle = new (class {
    #command
    #frame

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "dot",
            60,
            "azure",
            width / 2,
            height / 2 + 200,
            new IDict({ "": ["はじめから", "つづきから", "おわる"], "2": ["はい", "!いいえ"] }),
            {
                titles: new IDict({ "2": "ほんとに?" }),
                text_align: "center",
            },
        )
    }

    start() {
        this.#frame = 0
    }

    loop() {
        this.#frame++

        Irect(ctxMain, "#111", 0, 0, width, height)

        Igear(ctxMain, width / 2, height / 2 - 200, "#f0ffff80", 30, 13, 4, { line_width: 2, theta: this.#frame / 240 })

        Itext(ctxMain, "azure", "dot", 90, width / 2, height / 2 - 200, "欠けた歯車のセレナーデ", {
            frame: this.#frame / 8,
            text_align: "center",
            baseline: "middle",
            transparent: true,
        })

        Iarc(ctxMain, "#f0ffff80", width / 2, height / 2 - 200, 60, { line_width: 2 })

        this.#command.run()

        if (this.#command.is_match("0")) {
            changeScene(sceneMain, 2500)
            this.#command.reset()
        } else if (this.#command.is_match("21")) {
            this.#command.cancel(2)
        } else if (this.#command.is_match("20")) {
            window.close()
        }
    }
})()
