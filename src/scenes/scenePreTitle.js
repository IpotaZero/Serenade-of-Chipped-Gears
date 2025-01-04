const scenePreTitle = new (class {
    constructor() {}

    loop() {
        Irect(ctxMain, "#111", 0, 0, width, height, { line_width: 0 })

        Itext(ctxMain, "azure", "dot", 96, width / 2, height / 2 - 48, "Presented by MCR", {
            text_align: "center",
        })

        Itext(ctxMain, "azure", "dot", 48, width / 2, height / 2 + 120, "Push Any Key...", {
            text_align: "center",
        })

        if (keyboard.pressed.size > 0 || mouse.clicked) {
            changeScene(sceneTitle, 2500)
            // document.body.requestFullscreen()
        }
    }
})()
