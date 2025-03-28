const modeEvent = new (class {
    #isWaitingForInput
    #currentText
    #command
    #frame

    #currentGenerator

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

        if (!done) {
            if (typeof this.#currentText == "object" && this.#currentText[0] == "question") {
                this.#command.optionDict.dict[""] = this.#currentText[1]
                this.#command.titleDict.dict[""] = this.#currentText[2] ?? ""
                this.#command.reset()
            } else if (typeof this.#currentText == "function") {
                this.#currentGenerator = this.#currentText()
            }
        }

        if (!done) {
            this.#frame = 0
        }
    }

    loop() {
        if (this.#currentText == null) {
            return true
        }

        switch (typeof this.#currentText) {
            case "string": {
                this.#solveText()
                break
            }
            case "function": {
                this.#solveFunction()
                break
            }
            default: {
                this.#solveCommand()
            }
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

        Irect(ctxMain, "#111111f0", [20, 760], [width - 40, 295], { lineColor: "azure" })

        const blink = this.#frame % 60 < 30 && this.#isWaitingForInput ? "#{color}{azure}▼" : ""

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

    #solveFunction() {
        const { value, done } = this.#currentGenerator.next()
        if (done) {
            this.#next()
        }
    }

    #solveCommand() {
        switch (this.#currentText[0]) {
            case "question":
                Irect(ctxMain, "#111111f0", [20, 760], [width - 40, 295], { lineColor: "azure" })

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
