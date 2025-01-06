const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    writeMapData: (filename, str) => {
        console.log(filename, str)
        return ipcRenderer.send("write-map-data", filename, str)
    },
})
