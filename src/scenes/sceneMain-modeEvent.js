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
            [90, 780],
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
            this.#command.optionDict.dict[""] = this.#currentText[1]
            this.#command.titleDict.dict[""] = this.#currentText[2] ?? ""
            this.#command.reset()
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

        Irect(ctxMain, "#111111f0", [20, 760], [width - 40, 295], { lineColour: "azure" })

        const blink = this.#frame % 60 < 30 && this.#isWaitingForInput ? "#{colour}{azure}▼" : ""

        const isEnd = Itext(ctxMain, "azure", "dot", 48, [40, 780], this.#currentText + blink, {
            frame: this.#frame++ / 3,
            se: voice,
            maxWidth: 1380,
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
                Irect(ctxMain, "#111111f0", [20, 760], [width - 40, 295], { lineColour: "azure" })

                this.#command.run()

                if (this.#isWaitingForInput) {
                    if (this.#command.isMatch(".")) {
                        this.#next(this.#command.branch).then(() => {
                            this.#isWaitingForInput = true
                        })
                    }
                }
                break
        }
    }
})()
