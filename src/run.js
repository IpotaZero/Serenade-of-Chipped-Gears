let currentScene
let interval

const loadFont = Promise.all([
    Ifont("anzu", "fonts/APJapanesefontT.ttf"),
    Ifont("dot", "fonts/DotGothic16-Regular.ttf"),
])

// 読み込まれたら始める
document.addEventListener("DOMContentLoaded", async () => {
    currentScene = sceneTitle
    currentScene.start?.()

    await loadFont

    interval = setInterval(mainLoop, 1000 / 60)
})

// メインループ
const mainLoop = () => {
    container.style.cursor = ""

    currentScene.loop()

    inputHandler.updateInput()
}
