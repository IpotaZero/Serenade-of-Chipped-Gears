// ファイルパスを指定してフォントを読み込む
const Ifont = async (fontName, fontFilePath) => {
    try {
        // FontFaceオブジェクトを作成
        const font = new FontFace(fontName, `url(${fontFilePath})`)

        // フォントを読み込む
        await font.load()

        // 読み込んだフォントをドキュメントに追加
        document.fonts.add(font)

        console.log(`Font '${fontName}' has been loaded successfully.`)
    } catch (error) {
        console.error(`Failed to load font '${fontName}':`, error)
    }
}
