const { app, BrowserWindow, ipcMain } = require("electron")
const fs = require("fs")
const path = require("path")
const { readAllFiles } = require("./getSaveData.js")

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
    fs.writeFileSync(path.join(__dirname, `mapData/${filename}.mapdata`), str, "utf-8")
})

ipcMain.on("write-savedata", (_, savedataList) => {
    savedataList.forEach((savedataString, i) => {
        fs.writeFileSync(path.join(process.cwd(), `savedata/Save${i}.dat`), savedataString, "utf-8")
    })
})

ipcMain.handle("fetch-savedata", async (_) => {
    const savedataList = await readAllFiles(path.join(process.cwd(), "savedata"))
    return savedataList
})

// console.log(process.cwd())
