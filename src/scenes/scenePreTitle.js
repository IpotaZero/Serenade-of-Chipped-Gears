const scenePreTitle = new (class {
    constructor() {}

    loop() {
        Irect(ctxMain, "#111", 0, 0, width, height, { lineWidth: 0 })

        Itext(ctxMain, "azure", "dot", 96, width / 2, height / 2 - 48, "Presented by MCR", {
            textAlign: "center",
        })

        Itext(ctxMain, "azure", "dot", 48, width / 2, height / 2 + 120, "Push Any Key...", {
            textAlign: "center",
        })

        if (keyboard.pressed.size > 0 || mouse.clicked) {
            changeScene(sceneTitle, 2500)
            // document.body.requestFullscreen()
        }
    }
})()
