const Ianimation = class {
    constructor(duration) {
        this.duration = duration
        this.reset()
    }

    reset() {
        this.stop = false
        this.isRunning = false
    }

    /**
     * アニメーションを開始し、完了時にresolveするPromiseを返す
     * @param {Function} onUpdate 各フレームで実行されるコールバック関数
     * @returns {Promise} アニメーション完了時にresolveするPromise
     */
    async start(onUpdate) {
        if (this.isRunning) {
            return
        }

        this.isRunning = true
        const startTime = performance.now()

        this.promise = new Promise((resolve) => {
            const animate = (currentTime) => {
                if (this.stop) {
                    this.#handleStop(onUpdate, resolve)
                    return
                }

                const progress = this.#calculateProgress(currentTime - startTime)
                onUpdate(progress)

                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    this.#complete(resolve)
                }
            }

            requestAnimationFrame(animate)
        })

        return this.promise
    }

    /**
     * アニメーションを強制終了する
     */
    async stopAnimation() {
        this.stop = true
        await this.promise
    }

    /**
     * 経過時間から進捗率(0-1)を計算
     * @private
     */
    #calculateProgress(elapsedTime) {
        return Math.min(elapsedTime / this.duration, 1)
    }

    /**
     * 強制停止時の処理
     * @private
     */
    #handleStop(onUpdate, resolve) {
        this.isRunning = false
        onUpdate(1)
        resolve()
    }

    /**
     * アニメーション完了時の処理
     * @private
     */
    #complete(resolve) {
        this.isRunning = false
        resolve()
    }
}
