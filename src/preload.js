const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    writeMapData: (filename, str) => ipcRenderer.send("write-map-data", filename, str),
    writeSaveData: (savedataList) => ipcRenderer.send("write-savedata", savedataList),
    fetchSaveData: () => ipcRenderer.invoke("fetch-savedata"),
})
