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
            [80, 220],
            new IDict({
                "": ["持ち物", "装備", "セーブ", "#{color}{red}◇終了◇", "#{color}{lightGreen}☆編集☆"],
                "1": ["/Taro", "/Shun"],
                "1.": ["_頭", "_体", "_脚", "_靴"],
                // "2": ["/0", "/1", "/2"],
                "3": ["はい", "!いいえ"],
            }),
            {
                titleDict: new IDict({ "2": "どこに;セーブする?", "3": "ほんとに?" }),
                maxLineNumDict: new IDict({ "2": 3, ".*": 10 }),
            },
        )
    }

    start({ goods }) {
        this.#menuCommand.reset()

        this.#updateCommand(goods)

        this.#phase = "running"

        this.#endingFrame = 10
    }

    #updateCommand(goods) {
        this.#menuCommand.optionDict.dict["2"] = savedataList.map((_, i) => "/" + i)
        this.#menuCommand.optionDict.dict["2"].push("/empty")
        this.#menuCommand.optionDict.dict["0"] = goods.filter((s) => s.startsWith("_"))
    }

    #getProgress() {
        let progress = 1 - (1 - Math.min(1, this.#menuCommand.frame / 10)) ** 2

        if (this.#phase == "ending") progress = (this.#endingFrame / 10) ** 2

        return progress
    }

    loop({ goods }) {
        if (this.#phase == "ending") {
            this.#endingFrame--
            if (this.#endingFrame == 0) {
                inputHandler.canInput = true
                return "move"
            }
        }

        Irect(ctxMain, "#111111c0", [0, 0], [width, height])

        if ((keyboard.pushed.has("cancel") || mouse.rightClicked) && this.#menuCommand.branch == "") {
            this.#phase = "ending"
            inputHandler.canInput = false
        }

        const progress = this.#getProgress()

        ctxMain.save()
        ctxMain.globalAlpha = progress
        ctxMain.translate(0, (1 - progress) * 20)

        const formattedPlayTime = playTimeManager.getFormattedPlayTimeSum()

        Itext(ctxMain, "azure", "dot", 48, [60, 100], `現在地: ${mapManager.mapData.name}`)
        Itext(ctxMain, "azure", "dot", 48, [width / 2 + 60, 100], "プレイ時間: " + formattedPlayTime)
        Itext(ctxMain, "azure", "dot", 48, [width / 2 + 60, 150], "目的: ")

        Irect(ctxMain, "#111c", [70, 970], [300, 90], { lineColor: "azure" })
        Itext(ctxMain, "azure", "dot", 48, [350, 990], "0ｸﾚｼﾞｯﾄ", { textAlign: "right" })

        if (this.#menuCommand.isMatch("") || this.#menuCommand.isMatch("1")) {
            for (let i = 0; i < 2; i++) {
                Irect(ctxMain, "#111c", [400, 270 + i * 270], [1000, 250], { lineColor: "azure" })
                Itext(ctxMain, "azure", "dot", 48, [700, 300 + i * 270], `${["タロー", "シュン"][i]}: 中学生;`)
                Itext(ctxMain, "azure", "dot", 48, [700, 370 + i * 270], `LV: 1    #{color}{red}幽霊    HP: N/A`)
                Itext(ctxMain, "azure", "dot", 48, [700, 440 + i * 270], `EXP: 0/0         MP: 0/0`)
            }
        }

        if (this.#menuCommand.isMatch("1")) {
            for (let i = 0; i < 2; i++) {
                this.#menuCommand.overrideButton(
                    i,
                    Ibutton(ctxMain, "azure", "dot", 48, [400, 270 + i * 270], [1000, 250], "", {
                        lineWidth: 2,
                    }),
                )
            }

            const num = this.#menuCommand.num
            Irect(ctxMain, "red", [400, 270 + num * 270], [1000, 250], {
                lineWidth: 4,
                shadowColor: "azure",
                shadowBlur: 20,
            })
        } else if (this.#menuCommand.isMatch("1.")) {
            const character = this.#menuCommand.getSelectedNum(1)
            const num = this.#menuCommand.num
            const text = [
                ["なし", "セーター", "ジーンズ", "ボロボロの靴"],
                ["なし", "ブレザー", "チノパン", "スニーカー"],
            ][character][num]
            Itext(ctxMain, "azure", "dot", 48, [200, 270 + 48], text)
        } else if (this.#menuCommand.isMatch("2")) {
            const num = this.#menuCommand.num
            const position = this.#menuCommand.position

            const buttonHeight = 210
            const buttonGap = 40

            savedataList
                .concat(["empty"])
                .slice(position, position + 3)
                .forEach((s, i) => {
                    Irect(ctxMain, "#111c", [400, 270 + i * (buttonHeight + buttonGap)], [1000, buttonHeight])

                    this.#menuCommand.overrideButton(
                        i,
                        Ibutton(
                            ctxMain,
                            "azure",
                            "dot",
                            48,
                            [400, 270 + i * (buttonHeight + buttonGap)],
                            [1000, buttonHeight],
                            "",
                            {
                                lineWidth: 2,
                            },
                        ),
                    )

                    if (s == "empty") {
                        Itext(ctxMain, "azure", "dot", 48, [440, 300 + i * (buttonHeight + buttonGap)], `empty data`)
                        return
                    }

                    Itext(
                        ctxMain,
                        "azure",
                        "dot",
                        48,
                        [440, 290 + i * (buttonHeight + buttonGap)],
                        `Data${i + position}`,
                    )
                    Itext(
                        ctxMain,
                        "azure",
                        "dot",
                        48,
                        [440, 350 + i * (buttonHeight + buttonGap)],
                        `MapName: ${s.mapName}`,
                    )
                    Itext(
                        ctxMain,
                        "azure",
                        "dot",
                        48,
                        [440, 410 + i * (buttonHeight + buttonGap)],
                        `プレイ時間: ${playTimeManager.formatPlayTime(s.playTime)}`,
                    )
                })

            Irect(
                ctxMain,
                "red",
                [400, 270 + (num - this.#menuCommand.position) * (buttonHeight + buttonGap)],
                [1000, buttonHeight],
                {
                    lineWidth: 4,
                    shadowColor: "azure",
                    shadowBlur: 20,
                },
            )

            const [topNeeds, bottomNeeds] = this.#menuCommand.getDotNeeds()

            if (topNeeds) Itext(ctxMain, "azure", "dot", 48, [860, 200], `▲`)
            if (bottomNeeds) Itext(ctxMain, "azure", "dot", 48, [860, 1000], `▼`)
        } else if (this.#menuCommand.isMatch("2.")) {
            const savedata = new SaveData(
                mapManager.mapData.id,
                mapManager.mapData.name,
                playTimeManager.getPlayTimeSum(),
                playerManager.p,
                goods,
            )

            const num = this.#menuCommand.getSelectedNum(1)

            savedataList[num] = savedata

            electron.writeSaveData(savedataList)

            this.#updateCommand()

            this.#menuCommand.cancel(1)
        } else if (this.#menuCommand.isMatch("30")) {
            this.#menuCommand.reset()
            changeScene(sceneTitle, 1000)
        } else if (this.#menuCommand.isMatch("31")) {
            this.#menuCommand.cancel(2)
        } else if (this.#menuCommand.isMatch("4")) {
            this.#menuCommand.reset()
            ctxMain.restore()
            return "edit"
        }

        this.#menuCommand.run()

        if (this.#menuCommand.frame == 0) {
            if (this.#menuCommand.isMatch("2")) {
                this.#menuCommand.move(-2)
            }
        }

        ctxMain.restore()
    }
})()
