const Iimage = class {
    constructor(path, offsetX = 0, offsetY = 0, width = null, height = null) {
        const image = new Image()
        this.loaded = new Promise((resolve) => {
            image.onload = () => {
                this.image = document.createElement("canvas")
                this.image.width = width ?? image.width
                this.image.height = height ?? image.height
                const ctx = this.image.getContext("2d")
                ctx.imageSmoothingEnabled = false

                ctx.drawImage(image, -offsetX, -offsetY)

                resolve()
            }
        })

        image.src = path
    }

    draw(ctx, x, y, width, height) {
        ctx.drawImage(this.image, x, y, width ?? this.image.width, height ?? this.image.height)
    }
}
