const Icommand = class {
    static number = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    static se_cancel
    static se_ok
    static se_select

    #ctx
    #font
    #fontSize
    #colour
    #x
    #y
    optionDict

    #maxLineNumDict
    #titleDict
    #textAlign

    frame
    branch
    num
    position

    #currentState
    #textPadding

    se

    constructor(
        ctx,
        font,
        fontSize,
        colour,
        [x, y],
        optionsDict,
        {
            se = true,
            maxLineNumDict = new IDict({
                ".*": 1000,
            }),
            titleDict = new IDict({}),
            textAlign = "left",
        },
    ) {
        this.#ctx = ctx
        this.#font = font
        this.#fontSize = fontSize
        this.#colour = colour
        this.#x = x
        this.#y = y

        this.optionDict = optionsDict

        this.#maxLineNumDict = maxLineNumDict
        this.#titleDict = titleDict
        this.#textAlign = textAlign

        this.reset()
        this.#updateState()

        this.se = se
    }

    run() {
        this.frame += 1 / 3

        this.#receiveKeyAction()

        Isetfont(this.#ctx, this.#font, this.#fontSize)

        this.#drawTitle()
        this.#drawOptions()
        this.#drawDots()
        this.#drawArrow()
    }

    reset() {
        this.frame = 0
        this.branch = ""
        this.num = 0
        this.position = 0

        this.#updateState()
    }

    isMatch(regex) {
        return this.branch.match(new RegExp(`^${regex}$`))
    }

    select(num) {
        this.frame = 0
        this.num = 0
        this.position = 0
        this.branch += this.constructor.number.charAt(num)

        if (this.se) {
            if (this.getSelectedOption()[0] == "!") this.constructor.se_cancel?.play()
            else this.constructor.se_ok?.play()
        }

        this.#updateState()
    }

    cancel(depth) {
        let num = 0

        for (let i = 0; i < depth; i++) {
            if (this.branch == "") break

            num = this.constructor.number.indexOf(this.branch.charAt(this.branch.length - 1))
            this.branch = this.branch.slice(0, -1)
        }

        this.#updateState()

        this.frame = 0
        this.num = 0
        this.position = 0

        for (let i = 0; i < num; i++) this.#down()
    }

    getSelectedNum(num) {
        return this.constructor.number.indexOf(this.branch[num])
    }

    getSelectedOption() {
        return this.optionDict.get(this.branch.slice(0, -1))[this.constructor.number.indexOf(this.branch.slice(-1))]
    }

    #up() {
        this.num--

        if (this.num - this.position == -1) {
            this.position--
        }

        if (this.num == -1) {
            this.num = 0
            this.position = 0
            for (let i = 0; i < this.#currentState.optionList.length - 1; i++) this.#down()
        }

        this.num %= this.#currentState.optionList.length
    }

    #down() {
        this.num++

        const currentMaxLineNum = this.#maxLineNumDict.get(this.branch)

        if (this.num - this.position == currentMaxLineNum) {
            this.position++
        }

        if (this.num == this.#currentState.optionList.length) {
            this.num = 0
            this.position = 0
        }

        this.num %= this.#currentState.optionList.length
    }

    #receiveKeyAction() {
        if (keyboard.pushed.has("ok")) {
            this.select(this.num)
        } else if (keyboard.pushed.has("cancel") && this.branch != "") {
            this.cancel(1)
            if (this.se) this.constructor.se_cancel?.play()
        }

        if (!this.#currentState.optionList) return

        if (keyboard.longPressed.has("ArrowUp")) {
            this.#up()
            if (this.se) this.constructor.se_select?.play()
        } else if (keyboard.longPressed.has("ArrowDown")) {
            this.#down()
            if (this.se) this.constructor.se_select?.play()
        }
    }

    #drawTitle() {
        if (!this.#currentState.title) return

        Itext(this.#ctx, this.#colour, this.#font, this.#fontSize, this.#x, this.#y, this.#currentState.title, {
            frame: this.frame,
        })
    }

    #drawOptions() {
        if (!this.#currentState.optionList) return

        const scrolledOptions = this.#currentState.optionList.slice(
            this.position,
            this.position + this.#currentState.maxLineNum,
        )

        this.#textPadding = 0

        scrolledOptions.forEach((option, i) => {
            const { clicked, hovered } = this.#drawOption(option, i)

            if (hovered && mouse.moved) this.num = i + this.position

            if (clicked) this.select(i + this.position)

            this.#textPadding += this.#getPureText(option).length
        })
    }

    #drawDots() {
        if (!this.#currentState.optionList) return

        const text = this.#currentState.optionList[this.num]
        if (text[0] == "/") return

        if (this.#currentState.maxLineNum >= this.#currentState.optionList.length) return
        if (this.position > 0) {
            const { clicked } = this.#drawOption("...", -1)
            if (clicked) this.#up()
        }
        if (this.position < this.#currentState.maxLineNum - 1) {
            const { clicked } = this.#drawOption("...", this.#currentState.maxLineNum)
            if (clicked) this.#down()
        }
    }

    #drawOption(option, i) {
        if (option[0] == "/") return { clicked: false, hovered: false }
        if (option[0] == "!" || option[0] == "_") option = option.slice(1)

        const pureText = this.#getPureText(option)

        const textWidth = this.#ctx.measureText(pureText).width

        const { clicked, hovered } = Ibutton(
            this.#ctx,
            this.#colour,
            this.#font,
            this.#fontSize,
            this.#x,
            this.#y + this.#fontSize * (i + 2),
            textWidth,
            this.#fontSize,
            option,
            {
                frame: this.frame - this.#textPadding,
                lineWidth: 0,
                selected: this.num - this.position == i,
                textAlign: this.#textAlign,
            },
        )

        return { clicked, hovered }
    }

    #drawArrow() {
        if (!this.#currentState.optionList) return

        const text = this.#currentState.optionList[this.num]
        if (text[0] == "/") return

        const cvs = Irotate(this.#fontSize, this.#fontSize, (Math.PI / 16) * Math.sin(this.frame / 6), (ctx, x, y) => {
            Itext(ctx, this.#colour, this.#font, this.#fontSize, x, y, "→")
        })

        const pureText = this.#getPureText(text)

        const width = this.#ctx.measureText(pureText).width

        const padding = {
            left: 0,
            center: -width / 2,
            right: -width,
        }[this.#textAlign]

        this.#ctx.drawImage(
            cvs,
            this.#x + padding - this.#fontSize,
            this.#y + this.#fontSize * (this.num - this.position + 2),
        )
    }

    #getPureText(text) {
        return extractCommand(text)
            .map((c) => {
                if (typeof c == "string") return c
                if (c.command == "ruby") return c.values[0]
                return ""
            })
            .reduce((sum, c) => sum + c, "")
    }

    #updateState() {
        this.#currentState = {
            optionList: this.optionDict.get(this.branch),
            maxLineNum: this.#maxLineNumDict.get(this.branch),
            title: this.#titleDict.get(this.branch),
        }
    }
}
