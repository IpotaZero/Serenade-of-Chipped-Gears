const changeScene = async (scene, ms) => {
    currentScene = sceneDark

    inputHandler.canInput = false

    await Ifadeout.darken(ms)

    ctxMain.clearRect(0, 0, width, height)
    await scene.start?.()
    currentScene = scene
}

const sceneDark = new (class {
    constructor() {}
    loop() {}
})()

const Ifadeout = new (class {
    async darken(ms) {
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

    async rdarken(ms) {
        container.style.transition = `all 0ms`
        container.style.opacity = 0

        await sleep(10)

        return new Promise((resolve) => {
            container.style.transition = `all ${ms}ms`
            container.style.opacity = 1

            container.ontransitionend = () => {
                resolve()
            }
        })
    }

    async bluren(ms) {
        inputHandler.canInput = false

        const promise = new Promise((resolve) => {
            container.ontransitionend = () => {
                container.style.transition = `all ${ms}ms`
                container.style.filter = ""

                inputHandler.canInput = true
                resolve()
            }
        })

        container.style.transition = `all ${ms}ms`
        container.style.filter = "blur(30px)"

        return promise
    }

    async rotation(ms) {
        inputHandler.canInput = false

        const promise = new Promise((resolve) => {
            container.ontransitionend = () => {
                container.style.transition = `all ${ms}ms`
                container.style.transform = ""

                inputHandler.canInput = true
                resolve()
            }
        })

        container.style.transition = `all ${ms}ms`
        container.style.transform = "rotateY(90deg)"

        return promise
    }
})()
