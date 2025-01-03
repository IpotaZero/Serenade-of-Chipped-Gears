const Isetfont = (ctx, font, font_size, baseline, text_align, letter_spacing) => {
    ctx.font = font_size + "px " + font

    ctx.textBaseline = baseline
    ctx.textAlign = text_align
    ctx.letterSpacing = letter_spacing
}

const extractCommand = (text) => {
    // 正規表現でコマンド部分を抽出
    const regex = /#\{([^}]+)\}(\{[^}]+\})+/g

    let result = []
    let lastIndex = 0

    // 正規表現で一致する部分を処理
    text.replace(regex, (match, key, args, offset) => {
        // 前の文章部分を処理
        if (lastIndex < offset) {
            const parts = text.slice(lastIndex, offset).split(";")

            // セミコロン部分を改行コマンドとして追加
            parts.forEach((part, index) => {
                if (part !== "") result.push(part) // 文章部分
                if (index < parts.length - 1) result.push({ command: "newline" }) // 改行コマンド
            })
        }

        // コマンド部分を追加
        const values = [...match.matchAll(/\{([^}]+)\}/g)].slice(1).map((m) => m[1]) // 引数をすべて抽出
        result.push({ command: key, values })

        // 次の開始位置を更新
        lastIndex = offset + match.length
    })

    // 残りの文章部分を処理
    if (lastIndex < text.length) {
        const parts = text.slice(lastIndex).split(";")
        parts.forEach((part, index) => {
            if (part !== "") result.push(part) // 文章部分
            if (index < parts.length - 1) result.push({ command: "newline" }) // 改行コマンド
        })
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

    const textLength = commands.filter((c) => typeof c == "string").reduce((sum, c) => sum + c.length, 0)

    let current_x = x
    let current_y = y

    let characterCount = 0

    let over = true

    commands.forEach((c) => {
        if (!over) return

        if (typeof c == "string") {
            // 普通の文字列の場合
            const text = c.substring(0, frame - characterCount)

            const rect = ctx.measureText(text)

            ctx.fillText(text, current_x, current_y)
            current_x += rect.width
            characterCount += text.length

            if (text.length != c.length) over = false
        } else {
            // コマンドの場合
            switch (c.command) {
                case "newline": {
                    current_x = x
                    current_y += font_size + line_spacing
                    break
                }

                case "colour": {
                    ctx.fillStyle = c.values[0]
                    break
                }

                case "speed": {
                    frame = frame * c.values[0] + characterCount
                    break
                }

                case "ruby": {
                    const text = c.values[0].substring(0, frame - characterCount)
                    const rect = ctx.measureText(text)

                    ctx.fillText(text, current_x, current_y)

                    const width = ctx.measureText(c.values[0]).width

                    ctx.save()
                    Isetfont(ctx, font, font_size / 2, baseline, "center")
                    const ruby = c.values[1].substring(0, frame - characterCount - c.values[0].length / 2)
                    ctx.fillText(ruby, current_x + width / 2, current_y - font_size / 4)
                    ctx.restore()

                    current_x += rect.width
                    characterCount += text.length
                    break
                }
            }
        }
    })

    if (se != null && frame % 1 == 0 && text.length > frame) {
        se.play()
    }

    ctx.restore()

    const isEnd = characterCount >= textLength

    return isEnd
}
