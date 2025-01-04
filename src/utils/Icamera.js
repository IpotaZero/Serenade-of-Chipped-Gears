const Icamera = new (class {
    constructor() {
        this.p = vec(0, 0)
        this.speed = 1 / 12

        this.scale = 1.2
        this.scaleTarget = 1.2
        this.scaleSpeed = 1 / 24

        this.animation = null
    }

    run(target) {
        const v = target.sub(this.p).mlt(this.speed)

        this.p = this.p.add(v)

        this.scale += (this.scaleTarget - this.scale) * this.scaleSpeed
    }

    // msミリ秒かけてvまで移動
    async moveTo(v, ms) {
        // 実行中なら、終わらせる
        if (this.animation && this.animation.isRunning) {
            await this.animation.stopAnimation()
        }

        const currentP = this.p

        this.animation = new Ianimation(ms)

        return this.animation.start((x) => {
            this.p = currentP.add(v.sub(currentP).mlt(x))
        })
    }

    // msミリ秒かけてvだけ移動
    async shift(v, ms) {
        // 実行中なら、終わらせる
        if (this.animation && this.animation.isRunning) {
            await this.animation.stopAnimation()
        }

        const currentP = this.p
        const to = this.p.add(v)

        this.animation = new Ianimation(ms)

        return this.animation.start((x) => {
            this.p = currentP.add(to.sub(currentP).mlt(x))
        })
    }
})()
