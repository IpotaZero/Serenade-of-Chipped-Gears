const Iimage = class {
    constructor(path) {
        this.image = new Image()
        this.loaded = new Promise((solve) => {
            this.image.onload = () => {
                solve()
            }
        })

        this.image.src = path
    }

    draw(ctx, x, y, width, height) {
        ctx.drawImage(this.image, x, y, width, height)
    }
}
