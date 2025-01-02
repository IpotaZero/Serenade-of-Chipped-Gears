const { app, BrowserWindow } = require("electron")

// mainWindow を作成
const createMainWIndow = () => {
    mainWindow = new BrowserWindow({ width: 720, height: 540, autoHideMenuBar: true })

    mainWindow.setContentSize(720, 540)

    // html を指定
    const path = "file://" + __dirname + "/index.html"
    mainWindow.loadURL(path)

    mainWindow.on("closed", () => {
        mainWindow = null
    })
}

let mainWindow = null
app.on("ready", createMainWIndow)
