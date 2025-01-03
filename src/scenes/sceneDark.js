const changeScene = (scene, ms) => {
    currentScene = sceneDark

    inputHandler.canInput = false

    container.ontransitionend = async () => {
        container.ontransitionend = null
        ctxMain.clearRect(0, 0, width, height)

        await scene.start?.()

        container.style.transition = `all ${ms}ms`
        container.style.opacity = 1

        currentScene = scene
        inputHandler.canInput = true
    }

    container.style.transition = `all ${ms}ms`
    container.style.opacity = 0
}

const sceneDark = new (class {
    constructor() {}
    loop() {}
})()

const darken = async (ms) => {
    inputHandler.canInput = false

    const promise = new Promise((resolve) => {
        container.ontransitionend = () => {
            container.style.transition = `all ${ms}ms`
            container.style.opacity = 1

            inputHandler.canInput = true
            resolve()
        }
    })

    container.style.transition = `all ${ms}ms`
    container.style.opacity = 0

    return promise
}

const mosaicize = () =>
    new Promise((resolve) => {
        let count = 0
        const imageData = ctxMain.getImageData(0, 0, width, height).data

        const interval = setInterval(() => {
            const cvs = document.createElement("canvas")
            cvs.width = 4
            cvs.height = 3

            const ctx = cvs.getContext("2d")

            let newImageData = ctx.createImageData(4, 3)

            ILoop([0, 0], [4 - 1, 3 - 1], (x, y) => {
                const gw = width / 4
                const gh = height / 3

                newImageData.data[4 * (x + 3 * y)] = imageData[4 * (gw * x + gh * width * y)]
                newImageData.data[4 * (x + 3 * y) + 1] = imageData[4 * (gw * x + gh * width * y) + 1]
                newImageData.data[4 * (x + 3 * y) + 2] = imageData[4 * (gw * x + gh * width * y) + 2]
            })

            console.log(newImageData)

            ctx.putImageData(newImageData, 0, 0)

            ctxMain.drawImage(cvs, 0, 0, width, height)

            count++
            if (count >= 1) {
                clearInterval(interval)
                resolve()
            }
        }, 1000 / 60)
    })
