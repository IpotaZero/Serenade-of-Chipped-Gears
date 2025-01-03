const Iimage = class {
    constructor(path) {
        const image = new Image()
        this.loaded = new Promise((solve) => {
            image.onload = () => {
                this.image = document.createElement("canvas")
                this.image.width = image.width
                this.image.height = image.height
                const ctx = this.image.getContext("2d")
                ctx.drawImage(image, 0, 0)

                solve()
            }
        })

        image.src = path
    }

    draw(ctx, x, y, width, height) {
        ctx.drawImage(this.image, x, y, width, height)
    }
}
