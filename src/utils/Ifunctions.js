const gcd = (x, y) => (x % y ? gcd(y, x % y) : y)

const sleep = (ms) =>
    new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })

const Irotate = (width, height, angle, func) => {
    const cvs = document.createElement("canvas")
    cvs.width = width
    cvs.height = height
    const ctx = cvs.getContext("2d")

    const x = -width / 2
    const y = -height / 2

    ctx.translate(cvs.width / 2, cvs.height / 2)
    ctx.rotate(angle)

    func(ctx, x, y)

    ctx.translate(-cvs.width / 2, -cvs.height / 2)

    return cvs
}

const Isetfont = (ctx, font, font_size, baseline, text_align, letter_spacing) => {
    ctx.font = font_size + "px " + font

    ctx.textBaseline = baseline
    ctx.textAlign = text_align
    ctx.letterSpacing = letter_spacing
}

const extractCommand = (text) => {
    // 正規表現でコマンド部分を抽出
    const regex = /#\{([^}]+)\}\{([^}]+)\}/g

    let result = []
    let lastIndex = 0

    // 正規表現で一致する部分を処理
    text.replace(regex, (match, key, value, offset) => {
        // 前の文章部分をセミコロンで分割して追加
        if (lastIndex < offset) {
            const parts = text.slice(lastIndex, offset).split(";")
            result.push(...parts.filter((part) => part !== "")) // 空文字を除外
        }

        // コマンド部分を追加
        result.push({ command: key, value: value })

        // 次の開始位置を更新
        lastIndex = offset + match.length
    })

    // 残りの文章部分もセミコロンで分割して追加
    if (lastIndex < text.length) {
        const parts = text.slice(lastIndex).split(";")
        result.push(...parts.filter((part) => part !== ""))
    }

    return result
}

const Itext = (
    ctx,
    colour,
    font,
    font_size,
    x,
    y,
    text,
    {
        frame = 10000,
        max_width = 10000,

        text_align = "left",
        baseline = "top",
        line_spacing = 0,
        letter_spacing = "0px",

        transparent = false,

        se = null,
    } = {},
) => {
    ctx.save()

    ctx.fillStyle = colour
    Isetfont(ctx, font, font_size, baseline, text_align, letter_spacing)
    if (transparent) ctx.globalAlpha = frame / text.length / 2

    const commands = extractCommand(text)

    let current_x = x
    let current_y = y

    commands.forEach((c) => {
        if (typeof c == "string") {
            // 普通の文字列の場合
            const rect = ctx.measureText(c)
            ctx.fillText(c, current_x, current_y)
            current_y += rect.height
            characterCount += c.length
        } else {
            // コマンドの場合
            switch (c.command) {
                case "colour": {
                    break
                }

                case "speed": {
                    break
                }

                case "ruby": {
                    break
                }
            }
        }
    })

    let jumpCommand = null
    let substrings = []

    let characterCount = 0
    let trueCharacterCount = -1
    for (; characterCount <= frame && trueCharacterCount < text.length - 1; ) {
        trueCharacterCount++

        if (
            jumpCommand &&
            jumpCommand[0] <= trueCharacterCount &&
            trueCharacterCount <= jumpCommand[0] + jumpCommand[1]
        ) {
            continue
        }

        let char = text[trueCharacterCount]

        let rect = ctx.measureText(char)

        // ;で改行
        if (char == ";") {
            current_x = x
            current_y += rect.height + line_spacing
            continue
        } else if (char == "#") {
            const matchList = [...text.substring(trueCharacterCount).matchAll(/\{([^}]*)\}/g)].map((match) => match[1])

            if (!matchList) console.error("#のコマンドがうまくいってないかもー")

            switch (matchList[0]) {
                case "colour": {
                    ctx.fillStyle = matchList[1]

                    const kingCrimson = matchList.slice(0, 2).reduce((sum, match) => sum + match.length + 2, 0)
                    trueCharacterCount += kingCrimson
                    continue
                }
                case "speed": {
                    frame = frame * matchList[1] + characterCount - 1

                    const kingCrimson = matchList.slice(0, 2).reduce((sum, match) => sum + match.length + 2, 0)
                    trueCharacterCount += kingCrimson
                    continue
                }
                case "ruby": {
                    jumpCommand = [trueCharacterCount + 8 + matchList[1].length, matchList[2].length + 2]

                    substrings.push([
                        matchList[2],
                        current_x,
                        ctx.measureText(matchList[1]).width,
                        trueCharacterCount + matchList[2].length + 2 + matchList[2].length + matchList[1].length / 2,
                        0,
                    ])

                    const kingCrimson = 1 + matchList.slice(0, 1).reduce((sum, match) => sum + match.length + 2, 0)
                    trueCharacterCount += kingCrimson
                    continue
                }
            }
        }

        substrings.forEach((sub) => {
            ctx.save()
            Isetfont(ctx, font, font_size / 2, baseline, "center", letter_spacing)
            const char = sub[0].charAt(trueCharacterCount - sub[3])
            const charWidth = ctx.measureText(char).width
            const width = ctx.measureText(sub[0]).width
            if (char == "") {
                ctx.restore()
                return
            }
            ctx.fillText(char, sub[1] + sub[2] / 2 - width / 2 + charWidth * sub[4], current_y - font_size / 4)
            sub[4]++
            ctx.restore()
        })

        // 最大幅を超えそうになったら改行
        const width = current_x + rect.width
        if (width >= max_width) {
            current_x = x
            current_y += rect.height + line_spacing
        }

        ctx.fillText(char, current_x, current_y)
        current_x += rect.width
        characterCount++
    }

    if (se != null && frame % 1 == 0 && text.length > frame) {
        se.play()
    }

    ctx.restore()

    return trueCharacterCount >= text.length - 1
}

const Iarc = (ctx, colour, x, y, r, { start = 0, end = 2 * Math.PI, line_width = 0 } = {}) => {
    ctx.beginPath()
    ctx.arc(x, y, r, start, end)

    if (line_width == 0) {
        ctx.fillStyle = colour
        ctx.fill()
    } else {
        ctx.strokeStyle = colour
        ctx.lineWidth = line_width
        ctx.stroke()
    }
}

const Ipolygon = (ctx, vertices, density, x, y, r, colour, { theta = 0, line_width = 2 } = {}) => {
    ctx.beginPath()
    const g = gcd(vertices, density)
    vertices /= g
    density /= g

    ctx.lineCap = "square"

    for (let h = 0; h < g; h++) {
        const first = vec(x, y).add(vec(0, -r).rot(theta + (2 * Math.PI * h) / g / vertices))
        ctx.moveTo(first.x, first.y)

        const angle = (2 * Math.PI * density) / vertices
        for (let i = 1; i <= vertices; i++) {
            const to = vec(x, y).add(vec(0, -r).rot(theta + angle * i + (2 * Math.PI * h) / g / vertices))
            ctx.lineTo(to.x, to.y)
        }
    }

    ctx.closePath()

    ctx.strokeStyle = colour
    ctx.lineWidth = line_width
    ctx.stroke()
}

const Irect = (ctx, colour, x, y, width, height, { line_width = 0 } = {}) => {
    ctx.beginPath()

    if (line_width == 0) {
        ctx.fillStyle = colour
        ctx.fillRect(x, y, width, height)
    } else {
        ctx.strokeStyle = colour
        ctx.lineWidth = line_width
        ctx.strokeRect(x, y, width, height)
    }
}

const Iline = (ctx, colour, line_width, joints) => {
    ctx.beginPath()
    ctx.strokeStyle = colour
    ctx.lineWidth = line_width

    joints.forEach((j, i) => {
        if (i == 0) {
            ctx.moveTo(j.x, j.y)
            return
        }

        ctx.lineTo(j.x, j.y)
    })

    ctx.stroke()
}

const Ibutton = (
    ctx,
    colour,
    font,
    font_size,
    x,
    y,
    width,
    height,
    text,
    {
        line_width = 2,
        frame = 10000,
        text_align = "left",
        baseline = "top",
        outline_colours = [],
        outline_width = 0,
        transparent = false,
        clicking = false,
        selected = false,
    } = {},
) => {
    let x_ = x

    if (text_align == "center") x_ = x + width / 2

    const P = mouse.p

    ctx.save()

    const result = {
        clicked: false,
        hovered: false,
    }

    if (x <= P.x && P.x <= x + width && y <= P.y && P.y <= y + height) {
        container.style.cursor = "pointer"
        result.hovered = true

        if (clicking ? mouse.clicking : mouse.clicked) {
            result.clicked = true
            return result
        }

        ctx.shadowBlur = 10
        ctx.shadowColor = colour
    }

    if (selected) {
        ctx.shadowBlur = 10
        ctx.shadowColor = colour
    }

    if (line_width > 0)
        Irect(ctx, colour, x, y, width, height, {
            line_width: line_width,
        })

    Itext(ctx, colour, font, font_size, x_, y + 2, text, {
        frame: frame,
        text_align: text_align,
        outline_colours: outline_colours,
        outline_width: outline_width,
        transparent: transparent,
        baseline: baseline,
    })

    ctx.restore()

    return result
}

const Iscroll = (x, y, width, height) => {
    if (x < mouse.p.x && mouse.p.x < x + width && y < mouse.p.y && mouse.p.y < y + height) {
        if (mouse.deltaY > 30) return -1
        if (mouse.deltaY < -30) return 1
    }

    return 0
}

const Irange = (ctx, colour, font, font_size, x, y, value, { outline_colours = [], outline_width = 0 } = {}) => {
    const is_clicked_left = Ibutton(ctx, colour, font, font_size, x, y, font_size, font_size, "◁", {
        line_width: 0,
        outline_colours: outline_colours,
        outline_width: outline_width,
    }).clicked
    const is_clicked_right = Ibutton(ctx, colour, font, font_size, x + font_size * 2, y, font_size, font_size, "▷", {
        line_width: 0,
        outline_colours: outline_colours,
        outline_width: outline_width,
    }).clicked

    const sc = Iscroll(x + font_size, y, font_size, font_size)

    Itext(ctx, colour, font, font_size, x + font_size * 1.5, y, value, {
        outline_colours: outline_colours,
        outline_width: outline_width,
        text_align: "center",
    })

    if (sc != 0) return sc

    if (is_clicked_left) return -1
    if (is_clicked_right) return 1

    return 0
}

const ILoop = (a, b, f) => {
    //aをコピー
    const arr = [...a]

    while (arr.join() != b.join()) {
        f(...arr)
        arr[arr.length - 1]++
        for (let i = arr.length - 1; i != 0; i--) {
            if (arr[i] > b[i]) {
                arr[i] = a[i]
                arr[i - 1]++
            }
        }
    }

    f(...arr)
}

console.log("Ifunctions.js is loaded")
