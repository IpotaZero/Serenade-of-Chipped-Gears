const IBGM = class {
    constructor(path) {
        this.path = path
    }

    fetch() {
        this.reset()

        this.audio = new Audio(this.path)
        this.audio.loop = true

        this.source = this.context.createMediaElementSource(this.audio)
        this.source.connect(this.gain)

        return new Promise((resolve) => {
            this.audio.oncanplay = () => {
                resolve()
            }
        })
    }

    reset() {
        if (!this.context) {
            this.context = new AudioContext()
            this.gain = this.context.createGain()
            this.gain.connect(this.context.destination)
        }

        if (this.audio) {
            this.audio.stop()
            this.audio.currentTime = 0
        }
    }

    play() {
        if (!this.audio) return
        return this.audio.play()
    }

    pause() {
        if (!this.audio) return
        return this.audio.pause()
    }

    // 0にはできない
    fade(value, ms) {
        if (!this.gain) return

        this.gain.gain.cancelScheduledValues(0)
        this.gain.gain.exponentialRampToValueAtTime(value, this.context.currentTime + ms / 1000)

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, ms)
        })
    }

    setVolume(value) {
        if (!this.gain) return
        this.gain.gain.cancelScheduledValues(0)
        this.gain.gain.value = value
    }
}
