let currentScene
let interval

Icommand.se_cancel = new Iaudio("sounds/決定ボタンを押す50.mp3")
Icommand.se_ok = new Iaudio("sounds/決定ボタンを押す44.mp3")
Icommand.se_select = new Iaudio("sounds/カーソル移動12.mp3")

const voice = new Iaudio("sounds/voice.wav")

const loadFont = Promise.all([
    Ifont("anzu", "fonts/APJapanesefontT.ttf"),
    Ifont("dot", "fonts/DotGothic16-Regular.ttf"),
])

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
