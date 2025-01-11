const sceneTitle = new (class {
    #command
    #frame

    constructor() {
        this.#command = new Icommand(
            ctxMain,
            "dot",
            60,
            "azure",
            [width / 2, height / 2 + 200],
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
            },
        )
    }

    start() {
        this.#frame = 0

        this.#command.optionDict.dict["1"] = savedataList.map((s, i) => "/" + i)
        this.#command.reset()
    }

    loop() {
        this.#frame++

        Irect(ctxMain, "#111", [0, 0], [width, height])

        Igear(ctxMain, width / 2, height / 2 - 200, "#f0ffff80", 30, 13, 4, { lineWidth: 2, theta: this.#frame / 240 })

        Itext(ctxMain, "red", "dot", 90, [80, 80], "欠#{colour}{azure}けた歯車のセレナーデ", {
            frame: this.#frame / 8,
            transparent: true,
        })

        Iarc(ctxMain, "#f0ffff80", width / 2, height / 2 - 200, 60, { lineWidth: 2 })

        this.#command.run()

        if (this.#command.isMatch("0")) {
            playStartTime = Date.now()
            sceneMain.loadSaveData(new SaveData("test", 0, vec(0, 0), []))
            changeScene(sceneMain, 2500)
            this.#command.reset()
        } else if (this.#command.isMatch("1.")) {
            playStartTime = Date.now()
            sceneMain.loadSaveData(savedataList[this.#command.num])
            changeScene(sceneMain, 2500)
            this.#command.reset()
        } else if (this.#command.isMatch("21")) {
            this.#command.cancel(2)
        } else if (this.#command.isMatch("20")) {
            window.close()
        }
    }
})()
