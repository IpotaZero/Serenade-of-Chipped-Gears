const InputHandler = class {
    constructor(container) {
        this.canInput = true
        this.container = container
        this.cvsStyle = getComputedStyle(container)

        // Keyboard state
        this.keyboard = {
            pressed: new Set(),
            longPressed: new Set(),
            pushed: new Set(),
            upped: new Set(),
            ctrlKey: false,
        }

        // Mouse state
        this.mouse = {
            clicking: false,
            rightClicking: false,
            middleClicking: false,

            clicked: false,
            rightClicked: false,
            middleClicked: false,

            p: vec(0, 0),
            moved: false,
            angle: 0,
            deltaX: 0,
            deltaY: 0,
        }

        // Focus state
        this.focusState = {
            isFocused: true,
            justFocused: false,
            justBlurred: false,
        }

        this.#initializeEventListeners()
    }

    #initializeEventListeners() {
        // Keyboard events
        document.addEventListener("keydown", this.#handleKeyDown.bind(this))
        document.addEventListener("keyup", this.#handleKeyUp.bind(this))

        // Mouse events
        this.container.addEventListener("mousemove", this.#handleMouseMove.bind(this))
        this.container.addEventListener("mousedown", this.#handleMouseDown.bind(this))
        this.container.addEventListener("mouseup", this.#handleMouseUp.bind(this))
        this.container.addEventListener("mouseleave", this.#handleMouseUp.bind(this))
        this.container.addEventListener("wheel", this.#handleWheel.bind(this))
        this.container.addEventListener("contextmenu", this.#handleContextMenu.bind(this))

        // Window focus events
        window.addEventListener("blur", this.#handleBlur.bind(this))
        window.addEventListener("focus", this.#handleFocus.bind(this))
    }

    #handleKeyDown(e) {
        if (!this.canInput) return

        if (e.ctrlKey) keyboard.ctrlKey = true

        if (!this.keyboard.pressed.has(e.code)) {
            this.keyboard.pushed.add(e.code)

            if (["KeyZ", "Enter", "Space"].includes(e.code)) {
                this.keyboard.pushed.add("ok")
            }
            if (["KeyX", "Escape", "Backspace"].includes(e.code)) {
                this.keyboard.pushed.add("cancel")
            }

            // console.log(keyboard.pushed)
        }

        this.keyboard.pressed.add(e.code)
        this.keyboard.longPressed.add(e.code)
    }

    #handleKeyUp(e) {
        if (!this.canInput) return

        this.keyboard.pressed.delete(e.code)
        this.keyboard.upped.add(e.code)
    }

    #handleMouseMove(e) {
        if (!this.canInput) return

        const rect = e.target.getBoundingClientRect()
        const center = vec(rect.width / 2, rect.height / 2)

        const cvsWidth = +this.cvsStyle.width.slice(0, -2)
        const cvsHeight = +this.cvsStyle.height.slice(0, -2)
        const cvsCenter = vec(cvsWidth, cvsHeight).mlt(1 / 2)

        this.mouse.p = vec(e.clientX - rect.x, e.clientY - rect.y)
            .sub(center)
            .rot(-this.mouse.angle)
            .add(cvsCenter)
            .mlt(width / cvsWidth)

        this.mouse.moved = true
    }

    #handleMouseDown(e) {
        if (!this.canInput) return

        switch (e.button) {
            case 0:
                this.mouse.clicked = true
                this.mouse.clicking = true
                break
            case 1:
                this.mouse.middleClicked = true
                this.mouse.middleClicking = true
                break
            case 2:
                this.mouse.rightClicked = true
                this.mouse.rightClicking = true
                break
        }
    }

    #handleMouseUp(e) {
        if (!this.canInput) return

        switch (e.button) {
            case 0:
                this.mouse.clicking = false
                break
            case 1:
                this.mouse.middleClicking = false
                break
            case 2:
                this.mouse.rightClicking = false
                break
        }
    }

    #handleWheel(e) {
        if (!this.canInput) return

        this.mouse.deltaX = e.deltaX
        this.mouse.deltaY = e.deltaY
    }

    #handleContextMenu(e) {
        e.preventDefault()

        if (!this.canInput) return

        // this.mouse.rightClicked = true
    }

    #handleBlur() {
        console.log("よそ見するにゃ!")
        this.focusState.isFocused = false
        this.focusState.justBlurred = true
    }

    #handleFocus() {
        console.log("こっち見んにゃ!")
        this.focusState.isFocused = true
        this.focusState.justFocused = true
    }

    updateInput() {
        this.keyboard.longPressed.clear()
        this.keyboard.pushed.clear()
        this.keyboard.upped.clear()
        this.keyboard.ctrlKey = false

        this.mouse.deltaY = 0
        this.mouse.clicked = false
        this.mouse.rightClicked = false
        this.mouse.middleClicked = false
        this.mouse.moved = false

        this.focusState.justFocused = false
        this.focusState.justBlurred = false

        if (!this.canInput) {
            this.keyboard.pressed.clear()
            this.mouse.clicking = false
            this.mouse.rightClicking = false
            this.mouse.middleClicking = false
        }
    }
}

const inputHandler = new InputHandler(container)

const { keyboard, mouse } = inputHandler
