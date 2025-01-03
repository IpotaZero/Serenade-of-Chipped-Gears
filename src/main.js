const { app, BrowserWindow } = require("electron")

// mainWindow を作成
const createMainWIndow = () => {
    mainWindow = new BrowserWindow({ width: 640, height: 480, autoHideMenuBar: true })

    mainWindow.setContentSize(640, 480)

    // html を指定
    const path = "file://" + __dirname + "/index.html"
    mainWindow.loadURL(path)

    mainWindow.on("closed", () => {
        mainWindow = null
    })
}

let mainWindow = null
app.on("ready", createMainWIndow)
