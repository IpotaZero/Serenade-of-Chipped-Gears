const Icommand2 = class {
    #ctx
    #font
    #fontSize
    #colour
    #x
    #y
    optionDict

    #maxLineNumDict

    frame
    branch
    num
    position

    #optionList

    constructor(
        ctx,
        font,
        fontSize,
        colour,
        [x, y],
        optionsDict,
        {
            maxLineNum = new IDict({
                ".*": 1000,
            }),
        },
    ) {
        this.#ctx = ctx
        this.#font = font
        this.#fontSize = fontSize
        this.#colour = colour
        this.#x = x
        this.#y = y

        this.optionDict = optionsDict

        this.#maxLineNumDict = maxLineNum

        this.frame = 0
        this.branch = ""
        this.num = 0
        this.position = 0
    }

    run() {
        this.frame++
        this.#optionList = this.optionDict.get(this.branch)

        Isetfont(this.#ctx, this.#font, this.#fontSize)

        this.#drawOptions()
    }

    reset() {}

    #drawOptions() {
        if (!this.#optionList) return

        const currentMaxLineNum = this.#maxLineNumDict.get(this.branch)

        const scrolledOptions = this.#optionList.slice(this.position, this.position + currentMaxLineNum)

        scrolledOptions.forEach((option, i) => {
            this.#drawOption(option, i)
        })
    }

    #drawOption(option, i) {
        const pureText = extractCommand(option)
            .map((c) => {
                if (typeof c == "string") return c
                if (c.command == "ruby") return c.values[0]
                return ""
            })
            .reduce((sum, c) => sum + c, "")

        const textWidth = this.#ctx.measureText(pureText).width

        const { clicked, hovered } = Ibutton(
            this.#ctx,
            this.#colour,
            this.#font,
            this.#fontSize,
            this.#x + this.#fontSize,
            this.#y + this.#fontSize * (i + 1),
            textWidth,
            this.#fontSize,
            option,
        )
    }

    isMatch(regex) {
        return this.branch.match(new RegExp(`^${regex}$`))
    }
}
