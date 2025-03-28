const Iimage = class {
    constructor(path, offsetX = 0, offsetY = 0, width = null, height = null) {
        this.loaded = new Promise((resolve) => {
            const image = new Image()

            this.image = document.createElement("canvas")

            image.onload = () => {
                this.image.width = width ?? image.width
                this.image.height = height ?? image.height
                const ctx = this.image.getContext("2d")
                ctx.imageSmoothingEnabled = false

                ctx.drawImage(image, -offsetX, -offsetY)

                resolve()
            }

            image.src = path
        })
    }

    draw(ctx, [x, y], [width = undefined, height = undefined], compositeOperation = "source-over") {
        ctx.save()
        ctx.globalCompositeOperation = compositeOperation
        ctx.drawImage(this.image, x, y, width ?? this.image.width, height ?? this.image.height)
        ctx.restore()
    }
}
