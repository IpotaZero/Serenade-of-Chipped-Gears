const getCtx = (id) => {
    const cvs = document.getElementById(id)
    cvs.width = width
    cvs.height = height
    const ctx = cvs.getContext("2d")

    ctx.imageSmoothingEnabled = false // 標準

    return [cvs, ctx]
}

// aspect-ratio: 4/3
const width = 1440
const height = 1080

const container = document.getElementById("canvas-container")
if (!container) throw new Error("no container")

const [cvsMain, ctxMain] = getCtx("main-canvas")
