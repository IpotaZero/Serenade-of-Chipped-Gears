const Isetfont = (ctx, font, fontSize, baseline, textAlign, letterSpacing) => {
    ctx.font = fontSize + "px " + font

    ctx.textBaseline = baseline
    ctx.textAlign = textAlign
    ctx.letterSpacing = letterSpacing
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
    color,
    font,
    fontSize,
    [x, y],
    text,
    {
        frame = 10000,
        maxWidth = 10000,

        textAlign = "left",
        baseline = "top",
        lineSpacing = 0,
        letterSpacing = "0px",

        transparent = false,

        se = null,
    } = {},
) => {
    ctx.save()

    ctx.fillStyle = color
    Isetfont(ctx, font, fontSize, baseline, "left", letterSpacing)

    const commands = extractCommand("" + text)

    const textLength = commands
        .map((c) => {
            if (typeof c == "string") return c.length
            if (c.command == "ruby") return c.values[0].length
            return 0
        })
        .reduce((sum, c) => sum + c, 0)

    if (transparent) ctx.globalAlpha = frame / (textLength + 10)

    let currentX = x
    let currentY = y

    let characterCount = 0

    let over = true

    let currentLine = []

    commands.forEach((c, i) => {
        if (!over) return

        if (typeof c == "string") {
            // 普通の文字列の場合

            // 同じ行の物を取ってくる
            if (!currentLine.includes(c)) {
                currentLine = []
                for (const text of commands.slice(i)) {
                    if (typeof text == "string") {
                        currentLine.push(text)
                    } else if (text.command == "newline") {
                        break
                    }
                }
            }

            const text = c.substring(0, frame - characterCount)

            // textAlign
            if (currentLine.indexOf(c) == 0) {
                const followText = currentLine.reduce((sum, text) => sum + text, "")
                const followRect = ctx.measureText(followText)
                currentX += {
                    "left": 0,
                    "center": -followRect.width / 2,
                    "right": -followRect.width,
                }[textAlign]
            }

            for (const char of text) {
                const rect = ctx.measureText(char)

                if (currentX - x + rect.width >= maxWidth) {
                    currentX = x
                    currentY += fontSize + lineSpacing
                }

                ctx.fillText(char, currentX, currentY)
                currentX += ctx.measureText(char).width
                characterCount++
            }

            if (text.length != c.length) over = false
        } else {
            // コマンドの場合
            switch (c.command) {
                case "newline": {
                    currentX = x
                    currentY += fontSize + lineSpacing
                    break
                }

                case "color": {
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

                    ctx.fillText(text, currentX, currentY)

                    const width = ctx.measureText(c.values[0]).width

                    ctx.save()
                    Isetfont(ctx, font, fontSize / 2, baseline, "center")
                    const ruby = c.values[1].substring(0, frame - characterCount - c.values[0].length / 2)
                    ctx.fillText(ruby, currentX + width / 2, currentY - fontSize / 3)
                    ctx.restore()

                    currentX += rect.width
                    characterCount += text.length
                    break
                }
            }
        }
    })

    if (se != null && frame % 1 == 0 && characterCount < textLength) {
        se.play()
    }

    ctx.restore()

    const isEnd = characterCount >= textLength

    return isEnd
}

const splitTextToFit = (context, text, maxWidth) => {
    let trimmedText = text
    while (context.measureText(trimmedText).width > maxWidth) {
        // 末尾から1文字ずつ削除
        trimmedText = trimmedText.slice(0, -1)
    }
    // 前部分と後部分をリストで返す
    return [trimmedText, text.slice(trimmedText.length)]
}
