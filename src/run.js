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

/**
 * 指定されたURLのJavaScriptファイルを動的に読み込み、
 * 読み込みと実行が完了したらPromiseを解決する関数
 *
 * @param {string} url - 読み込むJavaScriptファイルのURL
 * @param {Object} options - オプション設定
 * @param {boolean} options.async - 非同期読み込みを行うかどうか（デフォルト: true）
 * @param {string} options.crossOrigin - クロスオリジン設定
 * @param {boolean} options.removeAfterExecution - 実行後にscriptタグを削除するかどうか（デフォルト: false）
 * @returns {Promise<void>} スクリプトの読み込みと実行が完了したら解決されるPromise
 */
const loadScript = (url, options = {}) => {
    const { async = true, crossOrigin = null, removeAfterExecution = true } = options

    return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.type = "text/javascript"
        script.src = url
        script.async = async

        if (crossOrigin) {
            script.crossOrigin = crossOrigin
        }

        // 読み込み完了時のハンドラー
        script.onload = () => {
            if (removeAfterExecution) {
                script.remove()
            }
            resolve()
        }

        // エラー発生時のハンドラー
        script.onerror = (error) => {
            script.remove()
            reject(new Error(`Failed to load script: ${url}`))
        }

        // DOMに追加
        document.head.appendChild(script)
    })
}
