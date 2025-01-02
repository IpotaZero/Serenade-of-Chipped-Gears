const sceneTitle = new (class {
    #command
    #frame

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "anzu",
            60,
            "#111",
            width / 2,
            height / 2 + 200,
            new IDict({ "": ["はじめる"] }),
            {
                text_align: "center",
            },
        )
    }

    start() {
        this.#frame = 0
    }

    loop() {
        Irect(ctxMain, "#f2f2f2", 0, 0, width, height)
        Itext(ctxMain, "#111", "anzu", 90, width / 2, height / 2 - 200, "欠けた歯車のセレナーデ", {
            frame: this.#frame / 3,
            text_align: "center",
            transparent: true,
        })

        Iarc(ctxMain, "#111", width / 2, height / 2, 20)

        this.#command.run(this.#frame++ / 3)
    }
})()
