// 博士の異常な行数 または私は如何にして心配するのを止めて神クラスを愛するようになったか

const Icommand = class {
    static number = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    static se_cancel
    static se_ok
    static se_select

    constructor(
        ctx,
        font,
        font_size,
        colour,
        x,
        y,
        options,

        {
            titles = new IDict({}),
            outline_colours = [],
            outline_width = 0,
            max_line_num = 10000,
            transparent = false,
            text_align = "left",
        } = {},
    ) {
        this.ctx = ctx
        this.font = font
        this.font_size = font_size
        this.colour = colour
        this.x = x
        this.y = y
        this.options = options

        this.outline_colours = outline_colours
        this.outline_width = outline_width
        this.transparent = transparent
        this.max_line_num = max_line_num
        this.titles = titles
        this.text_align = text_align

        this.frame = 0
        this.branch = ""
        this.num = 0
        this.position = 0

        this.is_operable = true

        this.#init_range_values(options)
        this.#init_toggle_values(options)
    }

    #init_range_values(options) {
        this.range_value = new IDict({})

        for (let key in options.dict) {
            for (let option of options.dict[key]) {
                if (typeof option != "string" && option.length == 4) {
                    this.range_value.dict[key] ??= []
                    this.range_value.dict[key].push(option[1])
                }
            }
        }
    }

    #init_toggle_values(options) {
        this.toggle_value = new IDict({})

        for (let key in options.dict) {
            for (let option of options.dict[key]) {
                if (typeof option != "string" && option.length == 2) {
                    this.toggle_value.dict[key] ??= []
                    this.toggle_value.dict[key].push(option[1])
                }
            }
        }
    }

    run() {
        this.frame += 1 / 3

        this.is_selected = false

        if (this.#handle_cancel()) return

        this.#draw_title()

        const option = this.options.get(this.branch)

        if (option == null) return

        this.#solve_options(option)

        this.#receive_updown()
    }

    #solve_options(option) {
        if (typeof option == "string") {
            this.#draw_text(option)
            return
        }

        this.#draw_option(option)
    }

    #receive_updown() {
        if (keyboard.longPressed.has("ArrowDown")) {
            this.#down()
            this.constructor.se_select?.play()
        } else if (keyboard.longPressed.has("ArrowUp")) {
            this.#up()
            this.constructor.se_select?.play()
        }

        // console.log(this.num, this.position)
    }

    #scroll() {
        const option = this.options.get(this.branch)

        // スクロールの必要がなければ帰れ
        if (option.length <= this.max_line_num) return

        if (this.num - this.position == this.max_line_num - 1) this.position++

        if (this.position > option.length - this.max_line_num) this.position = option.length - this.max_line_num

        if (this.num == 0) {
            this.position = 0
            return
        }

        if (this.num - this.position <= 0) this.position--

        if (this.num - this.position > this.max_line_num) {
            this.position = option.length - this.max_line_num
            return
        }

        // console.log(this.num, this.position)
    }

    #handle_cancel() {
        if (this.is_operable && (keyboard.pushed.has("cancel") || mouse.rightClicked) && this.branch !== "") {
            this.frame = 0
            this.cancel()
            this.constructor.se_cancel?.play()
            return true
        }
        return false
    }

    #draw_title() {
        const title = this.titles.get(this.branch)
        if (title == null) return

        Itext(this.ctx, this.colour, this.font, this.font_size, this.x, this.y, title, {
            frame: this.frame,
            outline_colours: this.outline_colours,
            outline_width: this.outline_width,
            transparent: this.transparent,
            text_align: this.text_align,
        })
    }

    #draw_text(text) {
        Itext(this.ctx, this.colour, this.font, this.font_size, this.x, this.y, text, {
            outline_colours: this.outline_colours,
            outline_width: this.outline_width,
            text_align: this.text_align,
        })
    }

    #draw_line(text, i, text_count) {
        if (["!", "_"].includes(text[0])) text = text.substring(1)

        const width = this.ctx.measureText(text).width

        const is_selected = i == this.num - this.position

        const gap = this.text_align == "center" ? 0 : 1

        const r = is_selected ? Math.random() / 24 + gap : gap
        const r2 = is_selected ? Math.random() / 24 + 1 : 1

        const x = this.x + this.font_size * r
        const y = this.y + this.font_size * (i + r2)

        const { clicked, hovered } = Ibutton(
            this.ctx,
            this.colour,
            this.font,
            this.font_size,
            x + (this.text_align == "center" ? -width / 2 : 0),
            y,
            width,
            this.font_size,
            text,
            {
                line_width: 0,
                frame: this.frame - text_count,
                outline_colours: this.outline_colours,
                outline_width: this.outline_width,
                transparent: this.transparent,
                selected: is_selected,
                text_align: this.text_align,
            },
        )

        if (hovered && mouse.moved) this.num = i

        this.#solve_scroll(x, y, width)

        return clicked
    }

    #draw_dots(option, i, text_count) {
        if (option.length <= this.max_line_num) return false

        if (i == this.max_line_num - 1 && this.position < option.length - this.max_line_num) {
            const is_clicked = this.#draw_line("...", i, text_count)

            if (is_clicked) {
                this.#down()
                this.constructor.se_select?.play()
            }

            return true
        }

        if (this.position > 0 && i == 0) {
            const is_clicked = this.#draw_line("...", 0, text_count)

            if (is_clicked) {
                this.#up()
                this.constructor.se_select?.play()
            }

            return true
        }
    }

    #draw_range(text, i, j, text_count) {
        const width = this.ctx.measureText(text[0]).width

        const is_selected = i == this.num - this.position

        const r = is_selected ? Math.random() / 24 + 1 : 1
        const r2 = is_selected ? Math.random() / 24 + 1 : 1

        const x = this.x + this.font_size * r
        const y = this.y + this.font_size * (i + r2)

        Itext(this.ctx, this.colour, this.font, this.font_size, x, y, text[0], {
            outline_colours: this.outline_colours,
            outline_width: this.outline_width,
            transparent: this.transparent,
            frame: this.frame - text_count,
            text_align: this.text_align,
        })

        const ranges = this.range_value.get(this.branch)

        let lr = 0
        if (this.frame - text_count > 0)
            lr = Irange(this.ctx, this.colour, this.font, this.font_size, x + width, y, ranges[j], {
                outline_colours: this.outline_colours,
                outline_width: this.outline_width,
            })

        if (i == this.num) {
            if (keyboard.longPressed.has("left")) lr--
            if (keyboard.longPressed.has("right")) lr++
        }

        ranges[j] += lr

        let se_flag = true

        if (ranges[j] > text[3]) {
            ranges[j] = text[3]
            se_flag = false
        }
        if (ranges[j] < text[2]) {
            ranges[j] = text[2]
            se_flag = false
        }

        if (lr != 0 && se_flag) this.constructor.se_select.play()

        this.#solve_scroll(x, y, width)
    }

    #draw_toggle(text, i, h, text_count) {
        const tf = this.toggle_value.get(this.branch)[h]

        const is_clicked = this.#draw_line(text[0] + ": " + (tf ? "ON" : "OFF"), i, text_count)
        const is_pushed = i == this.num && keyboard.pushed.has("ok")

        if (!(is_clicked || is_pushed)) return

        this.toggle_value.get(this.branch)[h] = !this.toggle_value.get(this.branch)[h]

        this.constructor.se_select?.play()
    }

    #solve_scroll(x, y, width) {
        const sc = Iscroll(x, y, width, this.font_size)
        if (sc == 1) {
            this.#up()
            this.constructor.se_select?.play()
        } else if (sc == -1) {
            this.#down()
            this.constructor.se_select?.play()
        }
    }

    #draw_option(option) {
        Isetfont(this.ctx, this.font, this.font_size)

        let j = 0
        let h = 0

        let text_count = 0

        option.slice(this.position, this.position + this.max_line_num).forEach((text, i) => {
            if (this.#draw_dots(option, i, text_count)) return

            if (typeof text == "string") {
                const is_clicked = this.#draw_line(text, i, text_count)

                text_count += text.length

                if (this.is_selected) return

                const is_pushed = i + this.position == this.num && keyboard.pushed.has("ok")

                if (is_clicked || is_pushed) {
                    this.#select(i + this.position)
                }
            } else {
                text_count += text[0].length

                if (this.is_selected) return

                if (text.length == 2) {
                    this.#draw_toggle(text, i, h, text_count)
                    h++
                } else if (text.length == 4) {
                    this.#draw_range(text, i, j, text_count)
                    j++
                }
            }
        })

        if (this.is_selected) return

        this.#draw_arrow()
    }

    #draw_arrow() {
        const cvs = Irotate(
            this.font_size,
            this.font_size,
            (Math.PI / 16) * Math.sin((this.frame - 10000) / 6),
            (ctx, x, y) => {
                Itext(ctx, this.colour, this.font, this.font_size, x, y, "→", {
                    outline_colours: this.outline_colours,
                    outline_width: this.outline_width,
                })
            },
        )

        const width = this.ctx.measureText(this.options.get(this.branch)[this.num]).width

        this.ctx.drawImage(
            cvs,
            this.x + (this.text_align == "center" ? -width / 2 - this.font_size : 0),
            this.y + this.font_size * (this.num - this.position + 1),
        )
    }

    is_match(key) {
        if (this.branch.match(new RegExp("^" + key + "$"))) {
            return true
        }

        return false
    }

    get_range_value() {
        return this.range_value.get(this.branch)
    }

    get_toggle_value() {
        return this.toggle_value.get(this.branch)
    }

    get_selected_num(num) {
        return this.constructor.number.indexOf(this.branch[num])
    }

    get_selected_option() {
        return this.options.get(this.branch.slice(0, -1))[this.branch.slice(-1)]
    }

    #up() {
        const option = this.options.get(this.branch)
        if (option == null) return

        this.num += option.length - 1
        this.num %= option.length

        this.#scroll()
    }

    #down() {
        const option = this.options.get(this.branch)
        if (option == null) return

        this.num += 1
        this.num %= option.length

        this.#scroll()
    }

    cancel(n = 1) {
        this.is_selected = true
        // 元の位置
        let num = 0
        for (let i = 0; i < n; i++) {
            if (this.branch == "") break

            num = this.constructor.number.indexOf(this.branch.charAt(this.branch.length - 1))
            this.branch = this.branch.slice(0, -1)
        }
        this.num = 0
        this.position = 0
        for (let i = 0; i < num; i++) this.#down()
    }

    #select(num) {
        // 頭文字が_ならば選択できない
        if (this.options.get(this.branch)[num][0] == "_") return

        this.branch += this.constructor.number[num]
        this.num = 0
        this.is_selected = true

        this.position = 0
        this.frame = 0

        if (this.get_selected_option()[0] == "!") {
            this.constructor.se_cancel?.play()
        } else {
            this.constructor.se_ok?.play()
        }
    }

    reset() {
        this.branch = ""
        this.num = 0
        this.position = 0
        this.frame = 0
    }
}
