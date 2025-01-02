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
