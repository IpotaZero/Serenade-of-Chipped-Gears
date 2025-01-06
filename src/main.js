const { app, BrowserWindow, ipcMain } = require("electron")
const fs = require("fs")
const path = require("path")

// mainWindow を作成
const createMainWIndow = () => {
    mainWindow = new BrowserWindow({
        width: 640,
        height: 480,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    })

    mainWindow.setContentSize(640, 480)

    // html を指定
    const htmlPath = path.join(__dirname, "index.html")
    mainWindow.loadURL(htmlPath)

    mainWindow.on("closed", () => {
        mainWindow = null
    })
}

let mainWindow = null
app.on("ready", createMainWIndow)

ipcMain.on("write-map-data", (_, filename, str) => {
    // console.log(path.join(__dirname, `mapData/${filename}.js`))
    fs.writeFileSync(path.join(__dirname, `mapData/${filename}.js`), str, "utf-8")
})
