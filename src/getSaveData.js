const fs = require("fs").promises
const path = require("path")

async function readAllFiles(dirPath) {
    const files = await getAllFiles(dirPath) // 再帰的にすべてのファイルを取得
    const jsonStrings = []

    for (const file of files) {
        if (!file.endsWith(".dat")) continue
        const content = await fs.readFile(file, "utf-8")
        jsonStrings.push(content)
    }

    return jsonStrings
}

async function getAllFiles(dirPath) {
    let files = []
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
            files = files.concat(await getAllFiles(fullPath))
        } else {
            files.push(fullPath)
        }
    }

    return files
}

module.exports = {
    readAllFiles,
}
