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

const Irect = (ctx, colour, x, y, width, height, { line_width = 0, lineDash = [] } = {}) => {
    ctx.beginPath()

    if (line_width == 0) {
        ctx.fillStyle = colour
        ctx.fillRect(x, y, width, height)
    } else {
        ctx.save()

        ctx.setLineDash(lineDash)
        ctx.strokeStyle = colour
        ctx.lineWidth = line_width
        ctx.strokeRect(x, y, width, height)

        ctx.restore()
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
    fontSize,
    x,
    y,
    width,
    height,
    text,
    {
        lineWidth = 2,
        frame = 10000,
        textAlign = "left",
        baseline = "top",
        transparent = false,
        clicking = false,
        selected = undefined,
    } = {},
) => {
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

        if (selected || selected == null) {
            ctx.shadowBlur = 10
            ctx.shadowColor = colour
        }
    }

    if (selected) {
        ctx.shadowBlur = 10
        ctx.shadowColor = colour
    }

    if (lineWidth > 0)
        Irect(ctx, colour, x, y, width, height, {
            line_width: lineWidth,
        })

    Itext(ctx, colour, font, fontSize, x, y + 2, text, {
        frame: frame,
        textAlign: textAlign,
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

const Irange = (ctx, colour, font, font_size, x, y, value) => {
    const is_clicked_left = Ibutton(ctx, colour, font, font_size, x, y, font_size, font_size, "◁", {
        lineWidth: 0,
    }).clicked
    const is_clicked_right = Ibutton(ctx, colour, font, font_size, x + font_size * 2, y, font_size, font_size, "▷", {
        lineWidth: 0,
    }).clicked

    const sc = Iscroll(x + font_size, y, font_size, font_size)

    Itext(ctx, colour, font, font_size, x + font_size * 1.5, y, value, {
        textAlign: "center",
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

const AsyncILoop = async (a, b, f) => {
    //aをコピー
    const arr = [...a]

    while (arr.join() != b.join()) {
        await f(...arr)
        arr[arr.length - 1]++
        for (let i = arr.length - 1; i != 0; i--) {
            if (arr[i] > b[i]) {
                arr[i] = a[i]
                arr[i - 1]++
            }
        }
    }

    await f(...arr)
}

console.log("Ifunctions.js is loaded")
