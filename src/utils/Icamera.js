const Icamera = new (class {
    constructor() {
        this.p = vec(0, 0)
        this.speed = 1 / 12

        this.scale = 1.2
        this.scaleTarget = 1.2
        this.scaleSpeed = 1 / 24
    }

    run(target) {
        const v = target.sub(this.p).mlt(this.speed)

        this.p = this.p.add(v)

        this.scale += (this.scaleTarget - this.scale) * this.scaleSpeed
    }
})()
