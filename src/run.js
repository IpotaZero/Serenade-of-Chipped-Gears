let currentScene
let interval

const loadFont = Ifont("anzu", "fonts/APJapanesefontT.ttf")

// 読み込まれたら始める
document.addEventListener("DOMContentLoaded", async () => {
    currentScene = sceneMain
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
