let currentScene
let interval

Icommand.se_cancel = new Iaudio("sounds/決定ボタンを押す50.mp3")
Icommand.se_ok = new Iaudio("sounds/決定ボタンを押す44.mp3")
Icommand.se_select = new Iaudio("sounds/カーソル移動12.mp3")

const voice = new Iaudio("sounds/voice.wav").setVolume(0.5)

let savedataList = []
let savedataIndex = 0

const saveDataLoaded = (async () => {
    savedataList = await (await electron.fetchSaveData()).map((s) => JSON.parse(s))
})()

const loadData = Promise.all([
    Ifont("anzu", "fonts/APJapanesefontT.ttf"),
    Ifont("dot", "fonts/DotGothic16-Regular.ttf"),
    saveDataLoaded,
])

// 読み込まれたら始める
document.addEventListener("DOMContentLoaded", async () => {
    await loadData

    currentScene = sceneTitle
    currentScene.start?.()

    // console.log(savedataList)

    // debug
    sceneMain.loadSaveData(savedataList[0] ?? SaveData.default())

    interval = setInterval(mainLoop, 1000 / 60)
})

// メインループ
const mainLoop = () => {
    container.style.cursor = ""

    currentScene.loop()

    inputHandler.updateInput()
}
